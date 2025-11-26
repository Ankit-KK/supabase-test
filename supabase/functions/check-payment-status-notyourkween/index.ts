import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import Razorpay from 'https://esm.sh/razorpay@2.9.2';

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

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get donation by order_id
    const { data: donation, error: dbError } = await supabase
      .from('notyourkween_donations')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (dbError || !donation) {
      throw new Error('Donation not found');
    }

    // If already successful, return cached status
    if (donation.payment_status === 'success') {
      return new Response(
        JSON.stringify({
          status: 'success',
          donation: {
            name: donation.name,
            amount: donation.amount,
            message: donation.message,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check with Razorpay
    const razorpay = new Razorpay({
      key_id: Deno.env.get('RAZORPAY_KEY_ID'),
      key_secret: Deno.env.get('RAZORPAY_KEY_SECRET'),
    });

    const razorpayOrder = await razorpay.orders.fetch(donation.razorpay_order_id);
    const paymentStatus = razorpayOrder.status === 'paid' ? 'success' : 'pending';

    // Update database if status changed
    if (paymentStatus !== donation.payment_status) {
      await supabase
        .from('notyourkween_donations')
        .update({ payment_status: paymentStatus })
        .eq('id', donation.id);
    }

    return new Response(
      JSON.stringify({
        status: paymentStatus,
        donation: {
          name: donation.name,
          amount: donation.amount,
          message: donation.message,
        },
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
