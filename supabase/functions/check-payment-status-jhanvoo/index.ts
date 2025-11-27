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
    const { orderId } = await req.json();

    console.log('[Jhanvoo] Checking payment status for:', orderId);

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get donation record
    const { data: donation, error: donationError } = await supabase
      .from('jhanvoo_donations')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (donationError || !donation) {
      console.error('[Jhanvoo] Donation not found:', donationError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If already successful, return immediately
    if (donation.payment_status === 'success') {
      console.log('[Jhanvoo] Payment already marked successful');
      return new Response(
        JSON.stringify({ status: 'success', donation }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check with Razorpay
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('[Jhanvoo] Missing Razorpay credentials');
      return new Response(
        JSON.stringify({ status: donation.payment_status, donation }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const razorpayResponse = await fetch(
      `https://api.razorpay.com/v1/orders/${donation.razorpay_order_id}`,
      {
        headers: {
          'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        },
      }
    );

    if (razorpayResponse.ok) {
      const razorpayOrder = await razorpayResponse.json();
      console.log('[Jhanvoo] Razorpay order status:', razorpayOrder.status);

      if (razorpayOrder.status === 'paid' && donation.payment_status !== 'success') {
        await supabase
          .from('jhanvoo_donations')
          .update({ payment_status: 'success' })
          .eq('id', donation.id);

        donation.payment_status = 'success';
      }
    }

    return new Response(
      JSON.stringify({ status: donation.payment_status, donation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Jhanvoo] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});