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

    console.log('manage-telegram-user called with action:', action, 'streamerId:', streamerId);
    console.log('authToken provided:', !!authToken, 'length:', authToken?.length || 0);

    // Validate auth token using the RPC function that handles hashed tokens
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .rpc('validate_session_token', { plain_token: authToken });

    console.log('Session validation result:', { 
      found: sessionData && sessionData.length > 0, 
      error: sessionError?.message 
    });

    if (sessionError || !sessionData || sessionData.length === 0) {
      console.error('Auth validation failed - no valid session found for token');
      return new Response(JSON.stringify({ error: 'Invalid or expired auth token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const validatedUser = sessionData[0];
    console.log('Auth validated, user_id:', validatedUser.user_id);

    // Verify user owns the streamer
    const { data: streamerData } = await supabaseAdmin
      .from('streamers')
      .select('id, user_id')
      .eq('id', streamerId)
      .single();

    if (!streamerData || streamerData.user_id !== validatedUser.user_id) {
      return new Response(JSON.stringify({ error: 'Unauthorized: You do not own this streamer' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'add') {
      // Check if this telegram user already exists for this streamer
      const { data: existing } = await supabaseAdmin
        .from('streamers_moderators')
        .select('id')
        .eq('streamer_id', streamerId)
        .eq('telegram_user_id', telegramUserId)
        .single();

      if (existing) {
        return new Response(JSON.stringify({ error: 'This Telegram user is already added as a moderator' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Add new telegram user (without deleting existing ones)
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
      // Remove specific telegram user by ID
      if (!telegramUserId) {
        return new Response(JSON.stringify({ error: 'telegramUserId is required for remove action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: deleteError } = await supabaseAdmin
        .from('streamers_moderators')
        .delete()
        .eq('streamer_id', streamerId)
        .eq('telegram_user_id', telegramUserId);

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
