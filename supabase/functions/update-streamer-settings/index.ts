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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // --- Authentication ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service client for DB operations
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { streamerId, setting, value } = await req.json();

    console.log('Update streamer settings:', { streamerId, setting, value, userId: user.id });

    // Validate required fields
    if (!streamerId || !setting) {
      return new Response(
        JSON.stringify({ success: false, error: 'streamerId and setting are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate allowed settings
    const allowedSettings = ['moderation_mode', 'telegram_moderation_enabled', 'tts_enabled', 'hyperemotes_enabled', 'hyperemotes_min_amount', 'alert_box_scale', 'goal_is_active', 'goal_name', 'goal_target_amount', 'media_upload_enabled', 'media_moderation_enabled', 'media_min_amount', 'tts_language_boost'];
    if (!allowedSettings.includes(setting)) {
      return new Response(
        JSON.stringify({ success: false, error: `Setting '${setting}' is not allowed` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify streamer exists AND user owns it
    const { data: streamer, error: streamerError } = await serviceClient
      .from('streamers')
      .select('id, streamer_name, user_id')
      .eq('id', streamerId)
      .single();

    if (streamerError || !streamer) {
      return new Response(
        JSON.stringify({ success: false, error: 'Streamer not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (streamer.user_id !== user.id) {
      console.error(`Forbidden: user ${user.id} tried to update streamer ${streamerId} owned by ${streamer.user_id}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the setting
    const { error: updateError } = await serviceClient
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
