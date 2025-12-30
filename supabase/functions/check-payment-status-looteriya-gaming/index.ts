import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();

    console.log('[Looteriya Gaming] Checking payment status for:', order_id);

    if (!order_id) {
      throw new Error('Order ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get donation from database
    const { data: donation, error: dbError } = await supabase
      .from('looteriya_gaming_donations')
      .select('*')
      .eq('order_id', order_id)
      .single();

    if (dbError || !donation) {
      console.error('[Looteriya Gaming] Donation not found:', dbError);
      throw new Error('Donation not found');
    }

    // If already successful, return immediately
    if (donation.payment_status === 'success') {
      return new Response(
        JSON.stringify({
          order_id: order_id,
          final_status: 'SUCCESS',
          payment_status: 'success',
          order_status: 'PAID',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check Razorpay order status
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret || !donation.razorpay_order_id) {
      throw new Error('Unable to check Razorpay status');
    }

    const razorpayAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    const razorpayResponse = await fetch(
      `https://api.razorpay.com/v1/orders/${donation.razorpay_order_id}`,
      {
        headers: {
          'Authorization': `Basic ${razorpayAuth}`,
        },
      }
    );

    if (!razorpayResponse.ok) {
      throw new Error('Failed to fetch Razorpay order status');
    }

    const razorpayOrder = await razorpayResponse.json();
    console.log('[Looteriya Gaming] Razorpay status:', razorpayOrder.status);

    return new Response(
      JSON.stringify({
        order_id: order_id,
        final_status: razorpayOrder.status === 'paid' ? 'SUCCESS' : 'PENDING',
        payment_status: donation.payment_status,
        order_status: razorpayOrder.status.toUpperCase(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Looteriya Gaming] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
