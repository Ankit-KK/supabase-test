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
  eryx_live : 'eryx_donations',
  gaming_with_latifa: 'gaming_with_latifa_donations',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const authToken = req.headers.get('x-auth-token') || body.authToken;
    const { streamerSlug, streamerId, goalActivatedAt } = body;

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

    // Two modes:
    // 1. Authenticated (dashboard): requires auth token, validates session + ownership
    // 2. Public (OBS overlay): no auth token, read-only progress number

    if (authToken) {
      // Authenticated mode
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

      // Verify access
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

      if (!isAdmin && streamerId && user?.streamer_id !== streamerId) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Look up streamer data if needed
    let resolvedStreamerId = streamerId;
    let resolvedGoalActivatedAt = goalActivatedAt;

    if (!resolvedStreamerId || !resolvedGoalActivatedAt) {
      const { data: streamerData, error: streamerError } = await supabase
        .from('streamers')
        .select('id, goal_activated_at, goal_is_active')
        .eq('streamer_slug', streamerSlug)
        .single();

      if (streamerError || !streamerData) {
        return new Response(JSON.stringify({ error: 'Streamer not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      resolvedStreamerId = streamerData.id;
      resolvedGoalActivatedAt = resolvedGoalActivatedAt || streamerData.goal_activated_at;

      if (!streamerData.goal_is_active || !resolvedGoalActivatedAt) {
        return new Response(JSON.stringify({ currentProgress: 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Fetch donations since goal activation
    const { data: donations, error: donError } = await supabase
      .from(tableName)
      .select('amount, currency')
      .eq('streamer_id', resolvedStreamerId)
      .eq('payment_status', 'success')
      .in('moderation_status', ['auto_approved', 'approved'])
      .gte('created_at', resolvedGoalActivatedAt);

    if (donError) {
      console.error('[get-goal-progress] Error fetching donations:', donError);
      return new Response(JSON.stringify({ error: 'Failed to fetch donations' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const currentProgress = donations?.reduce((sum, d) => {
      const rate = EXCHANGE_RATES_TO_INR[d.currency || 'INR'] || 1;
      return sum + (Number(d.amount) * rate);
    }, 0) || 0;

    return new Response(JSON.stringify({ currentProgress }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[get-goal-progress] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
