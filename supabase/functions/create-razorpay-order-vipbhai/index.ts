import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CURRENCY_MINIMUMS: Record<string, { minText: number; minVoice: number; minHypersound: number }> = {
  'INR': { minText: 40, minVoice: 150, minHypersound: 30 },
  'USD': { minText: 1, minVoice: 3, minHypersound: 1 },
  'EUR': { minText: 1, minVoice: 3, minHypersound: 1 },
  'GBP': { minText: 1, minVoice: 3, minHypersound: 1 },
  'AED': { minText: 4, minVoice: 12, minHypersound: 3 },
  'AUD': { minText: 2, minVoice: 5, minHypersound: 1.5 },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, amount, message, voiceMessageUrl, hypersoundUrl, currency = 'INR' } = await req.json();

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

    // Get currency minimums (default to INR if unknown)
    const minimums = CURRENCY_MINIMUMS[currency] || CURRENCY_MINIMUMS['INR'];

    // Validate minimum amounts based on donation type
    if (hypersoundUrl && amount < minimums.minHypersound) {
      throw new Error(`HyperSounds require minimum ${currency} ${minimums.minHypersound}`);
    }

    if (voiceMessageUrl && amount < minimums.minVoice) {
      throw new Error(`Voice messages require minimum ${currency} ${minimums.minVoice}`);
    }

    if (!hypersoundUrl && !voiceMessageUrl && amount < minimums.minText) {
      throw new Error(`Text messages require minimum ${currency} ${minimums.minText}`);
    }

    // Get streamer info
    const { data: streamerData, error: streamerError } = await supabase
      .from('streamers')
      .select('id, streamer_name')
      .eq('streamer_slug', 'vipbhai')
      .single();

    if (streamerError || !streamerData) {
      console.error('Streamer lookup error:', streamerError);
      throw new Error('Streamer not found');
    }

    // Generate unique order ID with vb_rp_ prefix (VIP BHAI Razorpay)
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const orderId = `vb_rp_${timestamp}_${randomString}`;

    // Convert amount to subunits based on currency
    const amountInSubunits = Math.round(amount * 100);

    // Create Razorpay order
    const razorpayOrderData = {
      amount: amountInSubunits,
      currency: currency,
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
      .from('vipbhai_donations')
      .insert({
        streamer_id: streamerData.id,
        name: name.trim(),
        amount,
        currency: currency,
        message: message?.trim() || null,
        voice_message_url: voiceMessageUrl || null,
        hypersound_url: hypersoundUrl || null,
        is_hyperemote: false,
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

    console.log('VIP BHAI donation created:', donation.id);

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
    console.error('Error in create-razorpay-order-vipbhai:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});