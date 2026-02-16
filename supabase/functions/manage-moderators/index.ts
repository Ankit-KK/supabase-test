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

    const authToken = req.headers.get('x-auth-token');
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
    const { action, streamerId, modName, telegramId, discordId, moderatorId } = await req.json();

    console.log('Manage moderators:', { action, streamerId, userId });

    if (!streamerId || !action) {
      return new Response(
        JSON.stringify({ success: false, error: 'streamerId and action are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify streamer exists and check ownership
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
        console.error(`Forbidden: user ${userId} tried to manage moderators for streamer ${streamerId}`);
        return new Response(
          JSON.stringify({ success: false, error: 'Forbidden' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('Admin bypass granted for', userData?.email);
    }

    // Execute action
    if (action === 'list') {
      const { data, error } = await serviceClient
        .from('streamers_moderators')
        .select('*')
        .eq('streamer_id', streamerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, moderators: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'add') {
      if (!modName?.trim() || (!telegramId?.trim() && !discordId?.trim())) {
        return new Response(
          JSON.stringify({ success: false, error: 'modName and at least one of telegramId or discordId are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await serviceClient
        .from('streamers_moderators')
        .insert({
          streamer_id: streamerId,
          telegram_user_id: telegramId?.trim() || null,
          mod_name: modName.trim(),
          discord_user_id: discordId?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`Moderator ${modName} added for streamer ${streamer.streamer_name}`);
      return new Response(
        JSON.stringify({ success: true, moderator: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'remove') {
      if (!moderatorId) {
        return new Response(
          JSON.stringify({ success: false, error: 'moderatorId is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await serviceClient
        .from('streamers_moderators')
        .update({ is_active: false })
        .eq('id', moderatorId)
        .eq('streamer_id', streamerId);

      if (error) throw error;

      console.log(`Moderator ${moderatorId} removed for streamer ${streamer.streamer_name}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Moderator removed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in manage-moderators:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
