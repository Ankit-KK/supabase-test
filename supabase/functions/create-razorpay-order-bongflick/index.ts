import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CURRENCY_MINIMUMS: Record<string, { text: number; voice: number; hypersound: number }> = {
  'INR': { text: 40, voice: 150, hypersound: 30 },
  'USD': { text: 1, voice: 3, hypersound: 1 },
  'EUR': { text: 1, voice: 3, hypersound: 1 },
  'GBP': { text: 1, voice: 3, hypersound: 1 },
  'AED': { text: 4, voice: 12, hypersound: 3 },
  'AUD': { text: 2, voice: 5, hypersound: 1.5 },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, amount, currency = 'INR', message, voiceMessageUrl, hypersoundUrl } = await req.json();

    if (!name || !amount) {
      throw new Error('Name and amount are required');
    }

    const mins = CURRENCY_MINIMUMS[currency] || CURRENCY_MINIMUMS['INR'];

    if (hypersoundUrl && amount < mins.hypersound) {
      throw new Error(`HyperSound minimum is ${currency} ${mins.hypersound}`);
    }
    if (voiceMessageUrl && amount < mins.voice) {
      throw new Error(`Voice message minimum is ${currency} ${mins.voice}`);
    }
    if (!voiceMessageUrl && !hypersoundUrl && amount < mins.text) {
      throw new Error(`Text message minimum is ${currency} ${mins.text}`);
    }

    const razorpayKeyId = Deno.env.get('razorpay-keyid');
    const razorpayKeySecret = Deno.env.get('razorpay-keysecret');

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: streamer } = await supabase
      .from('streamers')
      .select('id')
      .eq('streamer_slug', 'bongflick')
      .single();

    if (!streamer) {
      throw new Error('Streamer not found');
    }

    const orderId = `bf_rp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const amountInSubunits = Math.round(amount * 100);

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
      },
      body: JSON.stringify({
        amount: amountInSubunits,
        currency: currency,
        receipt: orderId,
        notes: {
          product_type: 'digital_engagement',
          customer_name: name.substring(0, 50),
        },
      }),
    });

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.json();
      console.error('Razorpay API error:', errorData);
      throw new Error(`Razorpay API error: ${errorData.error?.description || 'Unknown error'}`);
    }

    const razorpayOrder = await razorpayResponse.json();

    const { error: insertError } = await supabase
      .from('bongflick_donations')
      .insert({
        streamer_id: streamer.id,
        name: name.substring(0, 100),
        amount,
        currency,
        message: message ? message.substring(0, 500) : null,
        voice_message_url: voiceMessageUrl || null,
        hypersound_url: hypersoundUrl || null,
        order_id: orderId,
        razorpay_order_id: razorpayOrder.id,
        payment_status: 'pending',
        moderation_status: 'pending',
        is_hyperemote: false,
      });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        orderId: orderId,
        razorpay_order_id: razorpayOrder.id,
        razorpay_key_id: razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        internalOrderId: orderId,
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
