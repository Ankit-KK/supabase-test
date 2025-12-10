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

    const now = new Date().toISOString();

    // Fetch oldest unplayed donation whose scheduled time has passed
    // audio_scheduled_at <= NOW() means the delay period is over and it's ready to play
    const { data: donation, error: fetchError } = await supabase
      .from('ankit_donations')
      .select('id, name, amount, message, tts_audio_url, voice_message_url, hypersound_url, created_at, audio_scheduled_at')
      .is('audio_played_at', null)
      .in('moderation_status', ['approved', 'auto_approved'])
      .eq('payment_status', 'success')
      .or('tts_audio_url.not.is.null,voice_message_url.not.is.null,hypersound_url.not.is.null')
      .not('audio_scheduled_at', 'is', null) // Must have a scheduled time
      .lte('audio_scheduled_at', now) // Scheduled time has passed
      .order('audio_scheduled_at', { ascending: true }) // Play earliest scheduled first
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
      // No audio available - return 204 No Content
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // Determine which audio URL to use (hypersound > voice message > TTS)
    const audioUrl = donation.hypersound_url || donation.voice_message_url || donation.tts_audio_url;

    if (!audioUrl) {
      // No audio URL found - return 204 No Content
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
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

    console.log(`Serving audio for donation ${donation.id}: ${donation.name} - ₹${donation.amount} (scheduled: ${donation.audio_scheduled_at})`);

    // NO DELAY - audio is served immediately since scheduled time has already passed
    // The delay was already applied when setting audio_scheduled_at in the webhook

    // Fetch and proxy the audio directly to avoid redirect issues with OBS
    console.log(`Fetching audio from: ${audioUrl}`);
    const audioResponse = await fetch(audioUrl);

    if (!audioResponse.ok) {
      console.error('Failed to fetch audio:', audioResponse.status);
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Stream the audio directly to OBS
    return new Response(audioResponse.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': audioResponse.headers.get('Content-Type') || 'audio/mpeg',
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
