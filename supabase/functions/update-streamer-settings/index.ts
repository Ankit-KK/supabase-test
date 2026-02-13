import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-auth-token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { streamerId, setting, value, authToken } = await req.json();

    // --- Custom Auth: validate session token ---
    if (!authToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing auth token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: validatedUser, error: authError } = await serviceClient
      .rpc('validate_session_token', { plain_token: authToken });

    if (authError || !validatedUser || validatedUser.length === 0) {
      console.error('Auth validation error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Invalid session token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = validatedUser[0].user_id;
    console.log('Update streamer settings:', { streamerId, setting, value, userId });

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

    // Verify streamer exists
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

    // Ownership check with admin bypass
    if (streamer.user_id !== userId) {
      const { data: userData } = await serviceClient
        .from('auth_users')
        .select('email')
        .eq('id', userId)
        .single();

      const { data: adminEntry } = await serviceClient
        .from('admin_emails')
        .select('email')
        .eq('email', userData?.email)
        .maybeSingle();

      if (!adminEntry) {
        console.error(`Forbidden: user ${userId} tried to update streamer ${streamerId} owned by ${streamer.user_id}`);
        return new Response(
          JSON.stringify({ success: false, error: 'Forbidden' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('Admin bypass granted for', userData?.email);
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
