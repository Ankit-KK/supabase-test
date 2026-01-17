import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { streamer_id, auth_token, data_type } = await req.json();

    if (!streamer_id) {
      return new Response(
        JSON.stringify({ error: 'streamer_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!auth_token) {
      return new Response(
        JSON.stringify({ error: 'auth_token is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for full access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate auth token
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('auth_sessions')
      .select('user_id, expires_at')
      .eq('token', auth_token)
      .single();

    if (sessionError || !session) {
      console.error('Session validation failed:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Session expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has access to this streamer
    const { data: user, error: userError } = await supabaseAdmin
      .from('auth_users')
      .select('streamer_id, role')
      .eq('id', session.user_id)
      .single();

    if (userError || !user) {
      console.error('User lookup failed:', userError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has access to the requested streamer
    const hasAccess = user.role === 'admin' || user.streamer_id === streamer_id;
    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: 'Access denied to this streamer' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching ${data_type || 'all'} data for streamer: ${streamer_id}`);

    // Fetch data based on data_type
    if (data_type === 'stats') {
      // Fetch stats only
      const { data: donations, error: donationsError } = await supabaseAdmin
        .from('looteriya_gaming_donations')
        .select('amount, currency, created_at, moderation_status, payment_status')
        .eq('streamer_id', streamer_id);

      if (donationsError) {
        console.error('Error fetching donations for stats:', donationsError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch donations' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate stats
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const successfulDonations = (donations || []).filter(d => d.payment_status === 'success');
      
      // Currency conversion rates (approximate)
      const toINR: Record<string, number> = {
        'INR': 1,
        'USD': 83,
        'EUR': 90,
        'GBP': 105,
        'AED': 22.6,
        'SAR': 22.1,
        'QAR': 22.8,
        'KWD': 270,
        'BHD': 220,
        'OMR': 215
      };

      let totalRevenue = 0;
      let todayRevenue = 0;
      let pendingCount = 0;

      successfulDonations.forEach(d => {
        const rate = toINR[d.currency] || 1;
        const amountInINR = d.amount * rate;
        totalRevenue += amountInINR;

        const createdAt = new Date(d.created_at);
        if (createdAt >= todayStart) {
          todayRevenue += amountInINR;
        }
      });

      // Count pending donations
      pendingCount = (donations || []).filter(
        d => d.payment_status === 'success' && d.moderation_status === 'pending'
      ).length;

      return new Response(
        JSON.stringify({
          stats: {
            totalRevenue: Math.round(totalRevenue),
            todayRevenue: Math.round(todayRevenue),
            totalDonations: successfulDonations.length,
            pendingModeration: pendingCount
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (data_type === 'donations') {
      // Fetch recent approved donations
      const { data: donations, error: donationsError } = await supabaseAdmin
        .from('looteriya_gaming_donations')
        .select('*')
        .eq('streamer_id', streamer_id)
        .eq('payment_status', 'success')
        .order('created_at', { ascending: false })
        .limit(50);

      if (donationsError) {
        console.error('Error fetching donations:', donationsError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch donations' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ donations: donations || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (data_type === 'moderation') {
      // Fetch pending moderation items
      const { data: donations, error: donationsError } = await supabaseAdmin
        .from('looteriya_gaming_donations')
        .select('*')
        .eq('streamer_id', streamer_id)
        .eq('payment_status', 'success')
        .eq('moderation_status', 'pending')
        .order('created_at', { ascending: false });

      if (donationsError) {
        console.error('Error fetching moderation queue:', donationsError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch moderation queue' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ donations: donations || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Fetch all data
      const { data: donations, error: donationsError } = await supabaseAdmin
        .from('looteriya_gaming_donations')
        .select('*')
        .eq('streamer_id', streamer_id)
        .eq('payment_status', 'success')
        .order('created_at', { ascending: false })
        .limit(100);

      if (donationsError) {
        console.error('Error fetching all donations:', donationsError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch donations' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ donations: donations || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in get-dashboard-stats-looteriya-gaming:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});