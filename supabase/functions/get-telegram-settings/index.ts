import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { streamerId } = await req.json();

    if (!streamerId) {
      return new Response(
        JSON.stringify({ error: 'streamerId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching telegram settings for streamer: ${streamerId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the first active moderator for this streamer (the streamer themselves)
    const { data: moderator, error } = await supabase
      .from('streamers_moderators')
      .select('telegram_user_id, mod_name, is_active')
      .eq('streamer_id', streamerId)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching moderator:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch telegram settings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch count of all active moderators
    const { count: moderatorCount } = await supabase
      .from('streamers_moderators')
      .select('*', { count: 'exact', head: true })
      .eq('streamer_id', streamerId)
      .eq('is_active', true);

    console.log(`Found moderator:`, moderator, `Total count:`, moderatorCount);

    return new Response(
      JSON.stringify({ 
        telegramUserId: moderator?.telegram_user_id || null,
        modName: moderator?.mod_name || null,
        isActive: moderator?.is_active || false,
        moderatorCount: moderatorCount || 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-telegram-settings:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
