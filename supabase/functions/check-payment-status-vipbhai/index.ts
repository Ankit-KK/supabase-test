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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const razorpayKeyId = Deno.env.get('razorpay-keyid');
    const razorpayKeySecret = Deno.env.get('razorpay-keysecret');

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    // Fetch donation from database to get razorpay_order_id
    const { data: donation, error: dbError } = await supabase
      .from('vipbhai_donations')
      .select('razorpay_order_id, payment_status, amount, name')
      .eq('order_id', order_id)
      .single();

    if (dbError || !donation) {
      console.error('Donation lookup error:', dbError);
      throw new Error('Donation not found');
    }

    // Fetch order details from Razorpay
    const razorpayResponse = await fetch(
      `https://api.razorpay.com/v1/orders/${donation.razorpay_order_id}`,
      {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
        },
      }
    );

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error('Razorpay API error:', errorText);
      throw new Error('Failed to fetch payment status from Razorpay');
    }

    const razorpayOrder = await razorpayResponse.json();

    // Fetch payment details for this order
    const paymentsResponse = await fetch(
      `https://api.razorpay.com/v1/orders/${donation.razorpay_order_id}/payments`,
      {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
        },
      }
    );

    let payments = [];
    if (paymentsResponse.ok) {
      const paymentsData = await paymentsResponse.json();
      payments = paymentsData.items || [];
    }

    // Determine final status
    let finalStatus = 'pending';
    if (razorpayOrder.status === 'paid' || donation.payment_status === 'success') {
      finalStatus = 'success';
    } else if (razorpayOrder.status === 'attempted') {
      finalStatus = 'pending';
    }

    return new Response(
      JSON.stringify({
        order_status: razorpayOrder.status,
        final_status: finalStatus,
        order_amount: donation.amount,
        payments: payments.map(p => ({
          payment_id: p.id,
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
    console.error('Error in check-payment-status-vipbhai:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
