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

    // If already successful, return immediately (webhook handled all alerts/TTS)
    if (donation.payment_status === 'success') {
      console.log('[Looteriya Gaming] Payment already successful (handled by webhook)');
      return new Response(
        JSON.stringify({
          order_id: order_id,
          final_status: 'SUCCESS',
          payment_status: 'success',
          order_status: 'PAID',
          order_amount: donation.amount,
          customer_details: { customer_name: donation.name }
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
    
    // Get order status
    const orderResponse = await fetch(
      `https://api.razorpay.com/v1/orders/${donation.razorpay_order_id}`,
      { headers: { 'Authorization': `Basic ${razorpayAuth}` } }
    );

    if (!orderResponse.ok) {
      throw new Error('Failed to fetch Razorpay order status');
    }

    const razorpayOrder = await orderResponse.json();
    console.log('[Looteriya Gaming] Razorpay order status:', razorpayOrder.status);

    // Get payments for more detailed status
    const paymentsResponse = await fetch(
      `https://api.razorpay.com/v1/orders/${donation.razorpay_order_id}/payments`,
      { headers: { 'Authorization': `Basic ${razorpayAuth}` } }
    );

    let payments: any[] = [];
    if (paymentsResponse.ok) {
      const paymentsData = await paymentsResponse.json();
      payments = paymentsData.items || [];
    }

    // Determine final status
    let finalStatus = 'pending';
    if (razorpayOrder.status === 'paid' || payments.some((p: any) => p.status === 'captured')) {
      finalStatus = 'success';
    } else if (payments.some((p: any) => p.status === 'failed')) {
      finalStatus = 'failure';
    }

    // Update DB if status changed
    // NOTE: We only update payment_status here. The razorpay-webhook handles:
    // - TTS generation
    // - audio_scheduled_at (60 second fraud delay)
    // - Pusher events for dashboard/alerts
    // - moderation_status updates
    if (finalStatus === 'success' && donation.payment_status !== 'success') {
      console.log('[Looteriya Gaming] Updating payment status to success (webhook should have done this)');
      await supabase
        .from('looteriya_gaming_donations')
        .update({ payment_status: 'success' })
        .eq('order_id', order_id);
    } else if (finalStatus === 'failure' && donation.payment_status !== 'failure') {
      console.log('[Looteriya Gaming] Updating payment status to failure');
      await supabase
        .from('looteriya_gaming_donations')
        .update({ payment_status: 'failure' })
        .eq('order_id', order_id);
    }

    return new Response(
      JSON.stringify({
        order_id: order_id,
        final_status: finalStatus.toUpperCase(),
        payment_status: finalStatus,
        order_status: razorpayOrder.status.toUpperCase(),
        order_amount: donation.amount,
        customer_details: { customer_name: donation.name },
        payments: payments.map((p: any) => ({
          id: p.id,
          status: p.status,
          method: p.method,
          amount: p.amount / 100,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Looteriya Gaming] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, final_status: 'PENDING' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
