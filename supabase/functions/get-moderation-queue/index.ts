import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-auth-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

console.log('get-moderation-queue: function loaded');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Authentication: require valid session token
    const authToken = req.headers.get('x-auth-token');
    if (!authToken) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized: Missing authentication token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .rpc('validate_session_token', { plain_token: authToken });

    if (sessionError || !sessionData || sessionData.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized: Invalid or expired session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const sessionUser = sessionData[0] as any;
    console.log('Authenticated user for moderation queue:', sessionUser.email);

    let streamerId: string | null = null;
    let streamerSlug: string | null = null;
    let status = 'pending';
    let limit = 50;
    let offset = 0;

    // Parse JSON body for POST requests
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        streamerId = body.streamerId || null;
        streamerSlug = body.streamerSlug || null;
        status = body.status || 'pending';
        limit = parseInt(body.limit) || 50;
        offset = parseInt(body.offset) || 0;
      } catch (e) {
        console.error('Error parsing request body:', e);
      }
    } else {
      // Fallback to URL params for GET requests
      const url = new URL(req.url);
      streamerId = url.searchParams.get('streamerId');
      streamerSlug = url.searchParams.get('streamerSlug');
      status = url.searchParams.get('status') || 'pending';
      limit = parseInt(url.searchParams.get('limit') || '50');
      offset = parseInt(url.searchParams.get('offset') || '0');
    }

    console.log('Queue request:', { streamerId, streamerSlug, status, limit, offset });

    if (!streamerId && !streamerSlug) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'streamerId or streamerSlug required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get streamer info
    let streamer;
    if (streamerId) {
      const { data, error } = await supabaseAdmin
        .from('streamers')
        .select('id, streamer_slug, streamer_name, moderation_mode, telegram_moderation_enabled')
        .eq('id', streamerId)
        .single();
      
      if (error || !data) {
        return new Response(JSON.stringify({ success: false, error: 'Streamer not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      streamer = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('streamers')
        .select('id, streamer_slug, streamer_name, moderation_mode, telegram_moderation_enabled')
        .eq('streamer_slug', streamerSlug)
        .single();
      
      if (error || !data) {
        return new Response(JSON.stringify({ success: false, error: 'Streamer not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      streamer = data;
    }

    // Verify authenticated user has access to this streamer
    const { data: userRecord } = await supabaseAdmin
      .from('auth_users')
      .select('streamer_id, role')
      .eq('id', sessionUser.user_id)
      .single();

    const isAdmin = userRecord?.role === 'admin';
    const ownsStreamer = userRecord?.streamer_id === streamer.id;

    if (!isAdmin && !ownsStreamer) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden: You do not have access to this streamer' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Determine table name
    const tableName = `${streamer.streamer_slug.replace(/-/g, '_')}_donations`;

    // Build query
    let query = supabaseAdmin
      .from(tableName)
      .select('*', { count: 'exact' })
      .eq('payment_status', 'success')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by status
    if (status === 'pending') {
      query = query.eq('moderation_status', 'pending');
    } else if (status === 'approved') {
      query = query.in('moderation_status', ['approved', 'auto_approved']);
    } else if (status === 'rejected') {
      query = query.eq('moderation_status', 'rejected');
    }
    // 'all' doesn't add any filter

    const { data: donations, count, error: queryError } = await query;

    if (queryError) {
      console.error('Error fetching queue:', queryError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to fetch moderation queue' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get pending count for badge
    const { count: pendingCount } = await supabaseAdmin
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'success')
      .eq('moderation_status', 'pending');

    // Get banned donors for this streamer
    const { data: bannedDonors } = await supabaseAdmin
      .from('banned_donors')
      .select('donor_name')
      .eq('streamer_id', streamer.id)
      .eq('is_active', true);

    const bannedNames = new Set((bannedDonors || []).map(d => d.donor_name.toLowerCase()));

    // Add banned status to donations
    const donationsWithBanStatus = (donations || []).map(d => ({
      ...d,
      is_donor_banned: bannedNames.has(d.name.toLowerCase()),
      source_table: tableName
    }));

    return new Response(JSON.stringify({
      success: true,
      streamer: {
        id: streamer.id,
        slug: streamer.streamer_slug,
        name: streamer.streamer_name,
        moderationMode: streamer.moderation_mode,
        telegramEnabled: streamer.telegram_moderation_enabled
      },
      donations: donationsWithBanStatus,
      pagination: {
        total: count || 0,
        limit,
        offset,
        pendingCount: pendingCount || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in get-moderation-queue:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
