import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, amount, message, voiceMessageUrl, isHyperemote, selectedGifId } = await req.json();

    // Validation
    if (!name || !amount) {
      throw new Error('Name and amount are required');
    }

    // Validate minimum amounts
    if (isHyperemote && amount < 50) {
      throw new Error('Hyperemote minimum is ₹50');
    }
    if (voiceMessageUrl && amount < 150) {
      throw new Error('Voice message minimum is ₹150');
    }
    if (!voiceMessageUrl && !isHyperemote && amount < 40) {
      throw new Error('Text message minimum is ₹40');
    }

    // Get Razorpay credentials
    const razorpayKeyId = Deno.env.get('razorpay-keyid');
    const razorpayKeySecret = Deno.env.get('razorpay-keysecret');

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get streamer ID
    const { data: streamer } = await supabase
      .from('streamers')
      .select('id')
      .eq('streamer_slug', 'bongflick')
      .single();

    if (!streamer) {
      throw new Error('Streamer not found');
    }

    // Generate order ID
    const orderId = `bf_rp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create Razorpay order using REST API
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency: 'INR',
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

    // Insert donation record
    const { error: insertError } = await supabase
      .from('bongflick_donations')
      .insert({
        streamer_id: streamer.id,
        name: name.substring(0, 100),
        amount,
        message: message ? message.substring(0, 500) : null,
        voice_message_url: voiceMessageUrl || null,
        order_id: orderId,
        razorpay_order_id: razorpayOrder.id,
        payment_status: 'pending',
        moderation_status: 'pending',
        is_hyperemote: isHyperemote || false,
        selected_gif_id: selectedGifId || null,
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
