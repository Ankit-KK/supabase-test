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
    const { name, amount, message, voiceMessageUrl, isHyperemote } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const razorpayKeyId = Deno.env.get('razorpay-keyid');
    const razorpayKeySecret = Deno.env.get('razorpay-keysecret');

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    // Validate inputs
    if (!name || name.trim().length === 0) {
      throw new Error('Name is required');
    }

    if (!amount || amount <= 0) {
      throw new Error('Valid amount is required');
    }

    // Validate minimum amounts based on donation type
    if (isHyperemote && amount < 50) {
      throw new Error('Hyperemotes require minimum ₹50');
    }

    if (voiceMessageUrl && amount < 150) {
      throw new Error('Voice messages require minimum ₹150');
    }

    if (!isHyperemote && !voiceMessageUrl && amount < 40) {
      throw new Error('Text messages require minimum ₹40');
    }

    // Get streamer info
    const { data: streamerData, error: streamerError } = await supabase
      .from('streamers')
      .select('id, streamer_name')
      .eq('streamer_slug', 'sagarujjwalgaming')
      .single();

    if (streamerError || !streamerData) {
      console.error('Streamer lookup error:', streamerError);
      throw new Error('Streamer not found');
    }

    // Generate unique order ID with sug_rp_ prefix (Sagar Ujjwal Gaming Razorpay)
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const orderId = `sug_rp_${timestamp}_${randomString}`;

    // Create Razorpay order
    const razorpayOrderData = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: orderId,
    };

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
      },
      body: JSON.stringify(razorpayOrderData),
    });

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.text();
      console.error('Razorpay order creation failed:', errorData);
      throw new Error('Failed to create payment order');
    }

    const razorpayOrder = await razorpayResponse.json();

    // Store donation in database
    const { data: donation, error: donationError } = await supabase
      .from('sagarujjwalgaming_donations')
      .insert({
        streamer_id: streamerData.id,
        name: name.trim(),
        amount,
        message: message?.trim() || null,
        voice_message_url: voiceMessageUrl || null,
        is_hyperemote: isHyperemote || false,
        order_id: orderId,
        razorpay_order_id: razorpayOrder.id,
        payment_status: 'pending',
        moderation_status: 'pending',
      })
      .select()
      .single();

    if (donationError) {
      console.error('Database insert error:', donationError);
      throw new Error('Failed to store donation');
    }

    console.log('SAGAR UJJWAL GAMING donation created:', donation.id);

    return new Response(
      JSON.stringify({
        orderId: orderId,
        razorpay_order_id: razorpayOrder.id,
        razorpay_key_id: razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        donationId: donation.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-razorpay-order-sagarujjwalgaming:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});