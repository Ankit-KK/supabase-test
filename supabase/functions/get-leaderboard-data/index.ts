import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  slidey_playz: 'slidey_playz_donations',
  eryx: 'eryx_donations',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { streamerSlug } = await req.json();

    if (!streamerSlug || typeof streamerSlug !== 'string') {
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch top donator from aggregation table and latest 5 donations in parallel
    const [topResult, latestResult] = await Promise.all([
      supabase
        .from('streamer_donator_totals')
        .select('donator_name, total_amount')
        .eq('streamer_slug', streamerSlug)
        .order('total_amount', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from(tableName)
        .select('name, amount, currency, created_at')
        .eq('payment_status', 'success')
        .in('moderation_status', ['auto_approved', 'approved'])
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    if (topResult.error) {
      console.error(`[get-leaderboard-data] Top donator error for ${streamerSlug}:`, topResult.error);
    }
    if (latestResult.error) {
      console.error(`[get-leaderboard-data] Latest donations error for ${streamerSlug}:`, latestResult.error);
    }

    const topDonator = topResult.data
      ? { name: topResult.data.donator_name, totalAmount: topResult.data.total_amount }
      : null;

    return new Response(JSON.stringify({
      topDonator,
      latestDonations: latestResult.data || [],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[get-leaderboard-data] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
