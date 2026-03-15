import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-auth-token',
};

const EXCHANGE_RATES_TO_INR: Record<string, number> = {
  'INR': 1, 'USD': 89, 'EUR': 94, 'GBP': 113, 'AED': 24, 'AUD': 57,
};

const ALLOWED_TABLES: Record<string, string> = {
  ankit: 'ankit_donations',
  chiaa_gaming: 'chiaa_gaming_donations',
  looteriya_gaming: 'looteriya_gaming_donations',
  clumsy_god: 'clumsy_god_donations',
  wolfy: 'wolfy_donations',
  dorp_plays: 'dorp_plays_donations',
  zishu: 'zishu_donations',
  brigzard: 'brigzard_donations',
  w_era: 'w_era_donations',
  mr_champion: 'mr_champion_donations',
  demigod: 'demigod_donations',
  nova_plays: 'nova_plays_donations',
  starlight_anya: 'starlight_anya_donations',
  reyna_yadav: 'reyna_yadav_donations',
  slidey_playz: 'slidey_playz_donations',
  eryx: 'eryx_donations',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const authToken = req.headers.get('x-auth-token') || body.authToken;
    if (!authToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Validate session
    const { data: sessionData, error: sessionError } = await supabase.rpc('validate_session_token', {
      plain_token: authToken,
    });

    const sessionUserId = Array.isArray(sessionData)
      ? sessionData[0]?.user_id || sessionData[0]?.id
      : (sessionData as any)?.user_id || (sessionData as any)?.id || sessionData;

    if (sessionError || !sessionUserId) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { streamerSlug } = body;

    if (!streamerSlug) {
      return new Response(JSON.stringify({ error: 'streamerSlug is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tableName = ALLOWED_TABLES[streamerSlug];
    if (!tableName) {
      return new Response(JSON.stringify({ error: 'Invalid streamer slug' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get streamer data to verify access
    const { data: streamerData, error: streamerError } = await supabase
      .from('streamers')
      .select('id, user_id')
      .eq('streamer_slug', streamerSlug)
      .single();

    if (streamerError || !streamerData) {
      return new Response(JSON.stringify({ error: 'Streamer not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user has access (owner or admin)
    const { data: user } = await supabase
      .from('auth_users')
      .select('streamer_id, email')
      .eq('id', sessionUserId)
      .single();

    const { data: isAdmin } = await supabase
      .from('admin_emails')
      .select('id')
      .eq('email', user?.email || '')
      .maybeSingle();

    const isOwner = !streamerData.user_id || user?.streamer_id === streamerData.id;

    if (!isAdmin && !isOwner) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all successful donations for stats
    const { data: allDonations, error: statsError } = await supabase
      .from(tableName)
      .select('amount, currency, created_at, payment_status')
      .eq('streamer_id', streamerData.id)
      .eq('payment_status', 'success');

    if (statsError) {
      console.error('[get-dashboard-donations] Stats error:', statsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch stats' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate stats
    const today = new Date().toISOString().split('T')[0];
    let totalRevenue = 0;
    let todayRevenue = 0;
    let topDonation = 0;

    for (const d of (allDonations || [])) {
      const amountINR = Number(d.amount) * (EXCHANGE_RATES_TO_INR[d.currency || 'INR'] || 1);
      totalRevenue += amountINR;
      if (d.created_at && d.created_at.startsWith(today)) {
        todayRevenue += amountINR;
      }
      if (amountINR > topDonation) topDonation = amountINR;
    }

    const totalDonations = (allDonations || []).length;
    const averageDonation = totalDonations > 0 ? totalRevenue / totalDonations : 0;

    // Fetch recent approved donations (for the list)
    const { data: donations, error: donError } = await supabase
      .from(tableName)
      .select('id, name, amount, currency, message, voice_message_url, tts_audio_url, hypersound_url, is_hyperemote, media_url, media_type, moderation_status, payment_status, created_at, message_visible, streamer_id')
      .eq('streamer_id', streamerData.id)
      .eq('payment_status', 'success')
      .order('created_at', { ascending: false })
      .limit(50);

    if (donError) {
      console.error('[get-dashboard-donations] Donations error:', donError);
      return new Response(JSON.stringify({ error: 'Failed to fetch donations' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      stats: { totalRevenue, todayRevenue, totalDonations, averageDonation, topDonation },
      donations: donations || [],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[get-dashboard-donations] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
