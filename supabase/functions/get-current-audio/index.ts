import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Pusher from 'npm:pusher@5.1.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Active streamers only - mapping slugs to donation table names
const STREAMER_TABLE_MAP: Record<string, string> = {
  'ankit': 'ankit_donations',
  'chiaa_gaming': 'chiaa_gaming_donations',
  'looteriya_gaming': 'looteriya_gaming_donations',
  'clumsy_god': 'clumsy_god_donations',
  'wolfy': 'wolfy_donations',
};

// Active streamers only - mapping slugs to Pusher alert channel names
const STREAMER_CHANNEL_MAP: Record<string, string> = {
  'ankit': 'ankit-alerts',
  'chiaa_gaming': 'chiaa_gaming-alerts',
  'looteriya_gaming': 'looteriya_gaming-alerts',
  'clumsy_god': 'clumsy_god-alerts',
  'wolfy': 'wolfy-alerts',
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
    const alertsChannel = STREAMER_CHANNEL_MAP[streamerSlug];

    if (!tableName) {
      console.error(`No table mapping for streamer: ${streamerSlug}`);
      return new Response(JSON.stringify({ error: 'Streamer not supported for Media Source' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Debug logging to verify correct streamer isolation
    console.log(`[get-current-audio] Token validated for streamer: ${streamerSlug}, querying table: ${tableName}`);

    const now = new Date().toISOString();

    // Fetch oldest unplayed donation whose scheduled time has passed
    // audio_scheduled_at <= NOW() means the delay period is over and it's ready to play
    const { data: donation, error: fetchError } = await supabase
      .from(tableName)
      .select('id, name, amount, message, tts_audio_url, voice_message_url, hypersound_url, is_hyperemote, created_at, audio_scheduled_at, media_url, media_type')
      .is('audio_played_at', null)
      .in('moderation_status', ['auto_approved', 'approved'])
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

    // Egress monitoring: Log structured event for tracking
    console.log(JSON.stringify({
      event: 'audio_served',
      streamer: streamerSlug,
      donation_id: donation.id,
      audio_type: donation.hypersound_url ? 'hypersound' : 
                  donation.voice_message_url ? 'voice' : 'tts',
      timestamp: new Date().toISOString()
    }));
    
    console.log(`[get-current-audio] Serving audio for donation ${donation.id}: ${donation.name} - amount ${donation.amount}`);

    // Trigger Pusher event to show visual alert NOW (in sync with audio)
    if (alertsChannel) {
      try {
        const pusher = new Pusher({
          appId: Deno.env.get('PUSHER_APP_ID')!,
          key: Deno.env.get('PUSHER_KEY')!,
          secret: Deno.env.get('PUSHER_SECRET')!,
          cluster: Deno.env.get('PUSHER_CLUSTER')!,
          useTLS: true,
        });

        await pusher.trigger(alertsChannel, 'audio-now-playing', {
          id: donation.id,
          name: donation.name,
          amount: donation.amount,
          message: donation.message,
          voice_message_url: donation.voice_message_url,
          tts_audio_url: donation.tts_audio_url,
          hypersound_url: donation.hypersound_url,
          is_hyperemote: donation.is_hyperemote || false,
          created_at: donation.created_at,
          media_url: donation.media_url,
          media_type: donation.media_type,
        });

        console.log(`[get-current-audio] Triggered audio-now-playing event on channel: ${alertsChannel}`);
      } catch (pusherError) {
        console.error('[get-current-audio] Failed to trigger Pusher event:', pusherError);
        // Continue serving audio even if Pusher fails
      }
    }

    // CRITICAL: 302 Redirect to static R2 URL
    // Do NOT change to signed URLs or add query params - Media Source works best with static URLs
    // See egress-reduction plan for details. This pattern is locked for cost optimization.
    console.log(`[get-current-audio] Redirecting to R2: ${audioUrl}`);
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': audioUrl,  // Static R2 URL - DO NOT MODIFY
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
