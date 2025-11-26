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
    const { name, amount, message, donationType, voiceMessageUrl } = await req.json();

    if (!name || !amount) {
      throw new Error('Name and amount are required');
    }

    // Validate donation amounts based on type
    if (donationType === 'hyperemote' && amount < 50) {
      throw new Error('Minimum ₹50 required for hyperemotes');
    }
    if (donationType === 'voice' && amount < 150) {
      throw new Error('Minimum ₹150 required for voice messages');
    }
    if (donationType === 'text' && amount < 40) {
      throw new Error('Minimum ₹40 required for text messages');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get streamer ID
    const { data: streamer, error: streamerError } = await supabase
      .from('streamers')
      .select('id')
      .eq('streamer_slug', 'mriqmaster')
      .single();

    if (streamerError || !streamer) {
      throw new Error('Streamer not found');
    }

    // Generate internal order ID
    const orderId = `miq_rp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get Razorpay credentials
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

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
      console.error('Razorpay API error:', errorText);
      throw new Error('Failed to create Razorpay order');
    }

    const razorpayOrder = await razorpayResponse.json();

    // Insert donation record
    const { error: insertError } = await supabase
      .from('mriqmaster_donations')
      .insert({
        order_id: orderId,
        razorpay_order_id: razorpayOrder.id,
        name: name.substring(0, 50),
        amount,
        message: message ? message.substring(0, 500) : null,
        voice_message_url: voiceMessageUrl || null,
        is_hyperemote: donationType === 'hyperemote',
        payment_status: 'pending',
        moderation_status: 'pending',
        streamer_id: streamer.id,
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error('Failed to create donation record');
    }

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
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
