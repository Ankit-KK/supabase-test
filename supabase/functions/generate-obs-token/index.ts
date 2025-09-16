import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { streamerId, forceRegenerate = false } = await req.json();

    if (!streamerId) {
      return new Response(
        JSON.stringify({ error: 'Streamer ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify streamer exists
    const { data: streamer, error: streamerError } = await supabase
      .from('streamers')
      .select('id, streamer_name')
      .eq('id', streamerId)
      .single();

    if (streamerError || !streamer) {
      console.error('Streamer verification failed:', streamerError);
      return new Response(
        JSON.stringify({ error: 'Invalid streamer' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check for existing active token if not forcing regeneration
    if (!forceRegenerate) {
      const { data: existingToken, error: existingTokenError } = await supabase
        .from('obs_tokens')
        .select('token')
        .eq('streamer_id', streamerId)
        .eq('is_active', true)
        .maybeSingle();

      if (existingToken && !existingTokenError) {
        console.log(`Returning existing OBS token for streamer ${streamer.streamer_name}`);
        return new Response(
          JSON.stringify({ token: existingToken.token }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Generate secure token
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes, byte => byte.toString(16).padStart(2, '0')).join('');

    // Deactivate existing tokens
    await supabase
      .from('obs_tokens')
      .update({ is_active: false })
      .eq('streamer_id', streamerId)
      .eq('is_active', true);

    // Create new active token
    const { data: newToken, error: tokenError } = await supabase
      .from('obs_tokens')
      .insert({
        streamer_id: streamerId,
        token: token,
        is_active: true
      })
      .select()
      .single();

    if (tokenError) {
      console.error('Token creation failed:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Failed to create token' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Generated new OBS token for streamer ${streamer.streamer_name}`);

    return new Response(
      JSON.stringify({ token: newToken.token }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Generate OBS token error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});