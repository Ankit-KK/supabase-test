import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapping of streamer slugs to their donation table names
const STREAMER_TABLE_MAP: Record<string, string> = {
  'ankit': 'ankit_donations',
  'looteriya_gaming': 'looteriya_gaming_donations',
  'chiaa_gaming': 'chiaa_gaming_donations',
  'sizzors': 'sizzors_donations',
  'thunderx': 'thunderx_donations',
  'vipbhai': 'vipbhai_donations',
  'sagarujjwalgaming': 'sagarujjwalgaming_donations',
  'notyourkween': 'notyourkween_donations',
  'bongflick': 'bongflick_donations',
  'mriqmaster': 'mriqmaster_donations',
  'abdevil': 'abdevil_donations',
  'jhanvoo': 'jhanvoo_donations',
  'damask_plays': 'damask_plays_donations',
  'neko_xenpai': 'neko_xenpai_donations',
  'clumsygod': 'clumsygod_donations',
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

    // Validate the OBS token and get streamer info
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
    const tableName = STREAMER_TABLE_MAP[streamerSlug];

    if (!tableName) {
      console.error(`No table mapping for streamer: ${streamerSlug}`);
      return new Response(JSON.stringify({ error: 'Streamer not supported for Media Source' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing audio for streamer: ${streamerSlug}, table: ${tableName}`);

    // Fetch oldest unplayed donation with audio from the last 10 minutes only
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { data: donation, error: fetchError } = await supabase
      .from(tableName)
      .select('id, name, amount, message, tts_audio_url, voice_message_url, hypersound_url, created_at')
      .is('audio_played_at', null)
      .in('moderation_status', ['approved', 'auto_approved'])
      .eq('payment_status', 'success')
      .or('tts_audio_url.not.is.null,voice_message_url.not.is.null,hypersound_url.not.is.null')
      .gte('created_at', tenMinutesAgo)
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
      .from(tableName)
      .update({ audio_played_at: new Date().toISOString() })
      .eq('id', donation.id);

    if (updateError) {
      console.error('Error marking as played:', updateError);
    }

    console.log(`Serving audio for donation ${donation.id}: ${donation.name} - ₹${donation.amount}`);

    // Add 60-second delay to match platform-wide alert delay standard
    console.log('Waiting 60 seconds for alert delay...');
    await new Promise(resolve => setTimeout(resolve, 60000));

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
    console.error('Error in get-current-audio:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
