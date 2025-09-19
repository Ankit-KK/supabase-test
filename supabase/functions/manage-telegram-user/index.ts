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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { action, streamerId, telegramUserId, authToken } = await req.json();

    // Validate auth token by checking auth_sessions table
    const { data: sessionData } = await supabaseAdmin
      .from('auth_sessions')
      .select('user_id')
      .eq('token', authToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!sessionData) {
      return new Response(JSON.stringify({ error: 'Invalid or expired auth token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user owns the streamer
    const { data: streamerData } = await supabaseAdmin
      .from('streamers')
      .select('id, user_id')
      .eq('id', streamerId)
      .single();

    if (!streamerData || streamerData.user_id !== sessionData.user_id) {
      return new Response(JSON.stringify({ error: 'Unauthorized: You do not own this streamer' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'add') {
      // Remove existing entry for this streamer (if any)
      await supabaseAdmin
        .from('streamers_moderators')
        .delete()
        .eq('streamer_id', streamerId);

      // Add new telegram user
      const { error: insertError } = await supabaseAdmin
        .from('streamers_moderators')
        .insert({
          streamer_id: streamerId,
          mod_name: 'Telegram User',
          telegram_user_id: telegramUserId,
          is_active: true
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        return new Response(JSON.stringify({ error: 'Failed to add Telegram user' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Telegram user added successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'remove') {
      const { error: deleteError } = await supabaseAdmin
        .from('streamers_moderators')
        .delete()
        .eq('streamer_id', streamerId);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        return new Response(JSON.stringify({ error: 'Failed to remove Telegram user' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Telegram user removed successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in manage-telegram-user function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});