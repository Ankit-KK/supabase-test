import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-auth-token',
};

const EXCHANGE_RATES_TO_INR: Record<string, number> = {
  'INR': 1, 'USD': 89, 'EUR': 94, 'GBP': 113, 'AED': 24, 'AUD': 57,
};

// Allowed donation table names (security allowlist)
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
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authToken = req.headers.get('x-auth-token');
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
    const { data: session, error: sessionError } = await supabase.rpc('validate_session_token', {
      p_token: authToken,
    });

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { streamerId, streamerSlug, goalActivatedAt } = await req.json();

    if (!streamerId || !streamerSlug || !goalActivatedAt) {
      return new Response(JSON.stringify({ error: 'streamerId, streamerSlug, and goalActivatedAt are required' }), {
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

    // Verify user has access to this streamer
    const { data: user } = await supabase
      .from('auth_users')
      .select('streamer_id')
      .eq('id', session)
      .single();

    const { data: isAdmin } = await supabase
      .from('admin_emails')
      .select('id')
      .eq('email', (await supabase.from('auth_users').select('email').eq('id', session).single()).data?.email || '')
      .maybeSingle();

    if (!isAdmin && user?.streamer_id !== streamerId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch donations since goal activation
    const { data: donations, error: donError } = await supabase
      .from(tableName)
      .select('amount, currency')
      .eq('streamer_id', streamerId)
      .eq('payment_status', 'success')
      .in('moderation_status', ['auto_approved', 'approved'])
      .gte('created_at', goalActivatedAt);

    if (donError) {
      console.error(`[get-goal-progress] Error fetching donations:`, donError);
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
