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
    const { name, amount, message, voiceMessageUrl, isHyperemote, selectedGifId } = await req.json();

    console.log('[Jhanvoo] Creating order:', { name, amount, isHyperemote });

    // Validate minimum amounts
    if (isHyperemote && amount < 50) {
      return new Response(
        JSON.stringify({ error: 'Hyperemotes require minimum ₹50' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (voiceMessageUrl && amount < 150) {
      return new Response(
        JSON.stringify({ error: 'Voice interactions require minimum ₹150' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!voiceMessageUrl && !isHyperemote && amount < 40) {
      return new Response(
        JSON.stringify({ error: 'Text interactions require minimum ₹40' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Razorpay credentials
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('[Jhanvoo] Missing Razorpay credentials');
      return new Response(
        JSON.stringify({ error: 'Payment gateway not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get streamer ID
    const { data: streamer, error: streamerError } = await supabase
      .from('streamers')
      .select('id')
      .eq('streamer_slug', 'jhanvoo')
      .single();

    if (streamerError || !streamer) {
      console.error('[Jhanvoo] Streamer not found:', streamerError);
      return new Response(
        JSON.stringify({ error: 'Streamer not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate internal order ID
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const orderId = `jv_rp_${timestamp}_${randomStr}`;

    // Create Razorpay order
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: orderId,
      }),
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error('[Jhanvoo] Razorpay order creation failed:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const razorpayOrder = await razorpayResponse.json();
    console.log('[Jhanvoo] Razorpay order created:', razorpayOrder.id);

    // Insert donation record
    const { error: insertError } = await supabase
      .from('jhanvoo_donations')
      .insert({
        name: name.substring(0, 100),
        amount,
        message: message?.substring(0, 500) || null,
        voice_message_url: voiceMessageUrl || null,
        is_hyperemote: isHyperemote || false,
        selected_gif_id: selectedGifId || null,
        order_id: orderId,
        razorpay_order_id: razorpayOrder.id,
        payment_status: 'pending',
        streamer_id: streamer.id,
      });

    if (insertError) {
      console.error('[Jhanvoo] Database insert failed:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create donation record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Jhanvoo] Order created successfully:', orderId);

    return new Response(
      JSON.stringify({
        orderId,
        razorpay_order_id: razorpayOrder.id,
        razorpay_key_id: razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        internalOrderId: orderId,
      }),
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