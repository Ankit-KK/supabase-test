import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();
    
    if (!order_id) {
      throw new Error('Order ID is required');
    }

    console.log('Checking Ankit Razorpay payment status for order:', order_id);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Razorpay credentials
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    // Fetch the donation to get razorpay_order_id
    const { data: donation, error: dbError } = await supabase
      .from('ankit_donations')
      .select('*')
      .eq('order_id', order_id)
      .single();

    if (dbError || !donation) {
      console.error('Error fetching donation:', dbError);
      throw new Error('Donation not found');
    }

    const razorpayOrderId = donation.razorpay_order_id;
    if (!razorpayOrderId) {
      throw new Error('Razorpay order ID not found in donation record');
    }

    console.log('Fetching Razorpay order:', razorpayOrderId);

    // Query Razorpay API for order details
    const authHeader = 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    
    const orderResponse = await fetch(`https://api.razorpay.com/v1/orders/${razorpayOrderId}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('Razorpay order fetch error:', errorText);
      throw new Error('Failed to fetch order from Razorpay');
    }

    const orderData = await orderResponse.json();
    console.log('Razorpay order data:', orderData);

    // Query Razorpay API for payment details
    const paymentsResponse = await fetch(`https://api.razorpay.com/v1/orders/${razorpayOrderId}/payments`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    let payments = [];
    if (paymentsResponse.ok) {
      const paymentsData = await paymentsResponse.json();
      payments = paymentsData.items || [];
      console.log('Razorpay payments:', payments);
    }

    // Determine final status
    let finalStatus = 'pending';
    let paymentStatus = donation.payment_status || 'pending';

    if (orderData.status === 'paid' || payments.some(p => p.status === 'captured')) {
      finalStatus = 'success';
      paymentStatus = 'success';
    } else if (orderData.status === 'attempted' && payments.some(p => p.status === 'failed')) {
      finalStatus = 'failure';
      paymentStatus = 'failed';
    }

    // Update donation status if changed
    if (paymentStatus !== donation.payment_status) {
      await supabase
        .from('ankit_donations')
        .update({ payment_status: paymentStatus })
        .eq('order_id', order_id);
    }

    return new Response(
      JSON.stringify({
        order_status: orderData.status,
        final_status: finalStatus,
        order_amount: orderData.amount / 100, // Convert paise to rupees
        payments: payments.map(p => ({
          id: p.id,
          status: p.status,
          method: p.method,
          amount: p.amount / 100,
        })),
        customer_details: {
          customer_name: donation.name,
        },
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in check-payment-status-ankit:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        final_status: 'pending',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
