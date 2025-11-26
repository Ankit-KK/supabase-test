import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get donation from database
    const { data: donation, error: dbError } = await supabase
      .from('abdevil_donations')
      .select('*')
      .eq('order_id', order_id)
      .single();

    if (dbError || !donation) {
      throw new Error('Donation not found');
    }

    // Get Razorpay credentials
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    // Fetch order details from Razorpay
    const orderResponse = await fetch(
      `https://api.razorpay.com/v1/orders/${donation.razorpay_order_id}`,
      {
        headers: {
          'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        },
      }
    );

    if (!orderResponse.ok) {
      throw new Error('Failed to fetch order from Razorpay');
    }

    const orderData = await orderResponse.json();

    // Fetch payment details
    const paymentsResponse = await fetch(
      `https://api.razorpay.com/v1/orders/${donation.razorpay_order_id}/payments`,
      {
        headers: {
          'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        },
      }
    );

    let paymentDetails = null;
    if (paymentsResponse.ok) {
      const paymentsData = await paymentsResponse.json();
      if (paymentsData.items && paymentsData.items.length > 0) {
        paymentDetails = paymentsData.items[0];
      }
    }

    // Determine final status
    let final_status = donation.payment_status;
    if (orderData.status === 'paid' && donation.payment_status !== 'success') {
      final_status = 'success';
    } else if (orderData.status === 'attempted') {
      final_status = 'pending';
    }

    return new Response(
      JSON.stringify({
        order_status: orderData.status,
        final_status,
        amount: orderData.amount / 100,
        payment_details: paymentDetails,
        customer_name: donation.name,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
