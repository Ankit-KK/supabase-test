import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Parse request URL to get streamer_slug
    const url = new URL(req.url);
    const streamerSlug = url.searchParams.get('streamer_slug');

    if (!streamerSlug) {
      throw new Error('streamer_slug query parameter is required');
    }

    console.log(`[get-pusher-config] Request for streamer: ${streamerSlug}`);

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch pusher_group for this streamer
    const { data: streamer, error } = await supabase
      .from('streamers')
      .select('pusher_group, streamer_name')
      .eq('streamer_slug', streamerSlug)
      .single();

    if (error || !streamer) {
      console.error(`[get-pusher-config] Streamer not found: ${streamerSlug}`, error);
      throw new Error('Streamer not found');
    }

    const group = streamer.pusher_group || 1;
    console.log(`[get-pusher-config] ${streamerSlug} (${streamer.streamer_name}) → Group ${group}`);

    // Get PUBLIC Pusher credentials for this group (never expose secret!)
    const pusherKey = Deno.env.get(`PUSHER_KEY_${group}`);
    const pusherCluster = Deno.env.get(`PUSHER_CLUSTER_${group}`);

    if (!pusherKey || !pusherCluster) {
      console.error(`[get-pusher-config] Missing Pusher credentials for Group ${group}`);
      throw new Error('Pusher configuration incomplete');
    }

    return new Response(
      JSON.stringify({ 
        key: pusherKey, 
        cluster: pusherCluster,
        group: group,
        streamer: streamerSlug
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[get-pusher-config] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch Pusher configuration'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});