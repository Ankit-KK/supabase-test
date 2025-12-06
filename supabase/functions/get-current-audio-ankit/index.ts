import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate the OBS token belongs to Ankit
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('validate_obs_token_secure', { token_to_check: token });

    if (tokenError || !tokenData?.[0]?.is_valid) {
      console.error('Invalid token:', tokenError);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const streamerSlug = tokenData[0].streamer_slug;
    if (streamerSlug !== 'ankit') {
      return new Response(JSON.stringify({ error: 'Token not for Ankit' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch oldest unplayed donation with audio
    const { data: donation, error: fetchError } = await supabase
      .from('ankit_donations')
      .select('id, name, amount, message, tts_audio_url, voice_message_url, created_at')
      .is('audio_played_at', null)
      .in('moderation_status', ['approved', 'auto_approved'])
      .eq('payment_status', 'success')
      .or('tts_audio_url.not.is.null,voice_message_url.not.is.null')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching donation:', fetchError);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!donation) {
      // No audio available - return empty response
      return new Response(JSON.stringify({ 
        status: 'empty',
        message: 'No audio in queue' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine which audio URL to use (voice message takes priority)
    const audioUrl = donation.voice_message_url || donation.tts_audio_url;

    if (!audioUrl) {
      return new Response(JSON.stringify({ 
        status: 'empty',
        message: 'No audio URL found' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark as played
    const { error: updateError } = await supabase
      .from('ankit_donations')
      .update({ audio_played_at: new Date().toISOString() })
      .eq('id', donation.id);

    if (updateError) {
      console.error('Error marking as played:', updateError);
    }

    console.log(`Serving audio for donation ${donation.id}: ${donation.name} - ₹${donation.amount}`);

    // Return redirect to actual audio URL
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': audioUrl,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Error in get-current-audio-ankit:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
