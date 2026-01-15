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

    // Fetch all active moderators for this streamer
    const { data: moderators, error } = await supabase
      .from('streamers_moderators')
      .select('id, telegram_user_id, mod_name, is_active, role, can_approve, can_reject, can_hide_message, can_ban, can_replay')
      .eq('streamer_id', streamerId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching moderators:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch telegram settings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${moderators?.length || 0} active moderators`);

    // Return all moderators as an array
    return new Response(
      JSON.stringify({ 
        moderators: moderators || [],
        moderatorCount: moderators?.length || 0,
        // Keep backward compatibility with old format
        telegramUserId: moderators && moderators.length > 0 ? moderators[0].telegram_user_id : null,
        modName: moderators && moderators.length > 0 ? moderators[0].mod_name : null,
        isActive: moderators && moderators.length > 0 ? moderators[0].is_active : false
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
