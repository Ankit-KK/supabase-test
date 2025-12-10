import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supported currencies and their minimums
const CURRENCY_MINIMUMS: Record<string, { text: number; voice: number; hypersound: number }> = {
  'INR': { text: 40, voice: 150, hypersound: 30 },
  'USD': { text: 1, voice: 3, hypersound: 1 },
  'EUR': { text: 1, voice: 3, hypersound: 1 },
  'GBP': { text: 1, voice: 3, hypersound: 1 },
  'AED': { text: 3, voice: 10, hypersound: 3 },
  'AUD': { text: 1.5, voice: 5, hypersound: 1.5 },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, amount, currency = 'INR', message, voiceMessageUrl, hypersoundUrl } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const razorpayKeyId = Deno.env.get('razorpay-keyid');
    const razorpayKeySecret = Deno.env.get('razorpay-keysecret');

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    // Validate currency
    if (!CURRENCY_MINIMUMS[currency]) {
      throw new Error(`Unsupported currency: ${currency}`);
    }

    const minimums = CURRENCY_MINIMUMS[currency];

    // Validate inputs
    if (!name || name.trim().length === 0) {
      throw new Error('Name is required');
    }

    if (!amount || amount <= 0) {
      throw new Error('Valid amount is required');
    }

    // Validate minimum amounts based on donation type
    if (hypersoundUrl && amount < minimums.hypersound) {
      throw new Error(`HyperSounds require minimum ${currency} ${minimums.hypersound}`);
    }

    if (voiceMessageUrl && amount < minimums.voice) {
      throw new Error(`Voice messages require minimum ${currency} ${minimums.voice}`);
    }

    if (!hypersoundUrl && !voiceMessageUrl && amount < minimums.text) {
      throw new Error(`Text messages require minimum ${currency} ${minimums.text}`);
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
      amount: Math.round(amount * 100), // Convert to smallest currency unit
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
      .from('sagarujjwalgaming_donations')
      .insert({
        streamer_id: streamerData.id,
        name: name.trim(),
        amount,
        currency,
        message: message?.trim() || null,
        voice_message_url: voiceMessageUrl || null,
        hypersound_url: hypersoundUrl || null,
        is_hyperemote: !!hypersoundUrl,
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

    console.log('SAGAR UJJWAL GAMING donation created:', donation.id, 'currency:', currency);

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