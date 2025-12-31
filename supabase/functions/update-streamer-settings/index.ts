import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { streamerId, setting, value } = await req.json();

    console.log('Update streamer settings:', { streamerId, setting, value });

    // Validate required fields
    if (!streamerId || !setting) {
      return new Response(
        JSON.stringify({ success: false, error: 'streamerId and setting are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate allowed settings
    const allowedSettings = ['moderation_mode', 'telegram_moderation_enabled', 'tts_enabled', 'hyperemotes_enabled', 'hyperemotes_min_amount', 'alert_box_scale', 'goal_is_active', 'goal_name', 'goal_target_amount'];
    if (!allowedSettings.includes(setting)) {
      return new Response(
        JSON.stringify({ success: false, error: `Setting '${setting}' is not allowed` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify streamer exists
    const { data: streamer, error: streamerError } = await supabaseClient
      .from('streamers')
      .select('id, streamer_name')
      .eq('id', streamerId)
      .single();

    if (streamerError || !streamer) {
      return new Response(
        JSON.stringify({ success: false, error: 'Streamer not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the setting
    const { error: updateError } = await supabaseClient
      .from('streamers')
      .update({ [setting]: value, updated_at: new Date().toISOString() })
      .eq('id', streamerId);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully updated ${setting} to ${value} for streamer ${streamer.streamer_name}`);

    return new Response(
      JSON.stringify({ success: true, message: `${setting} updated successfully` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-streamer-settings:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
