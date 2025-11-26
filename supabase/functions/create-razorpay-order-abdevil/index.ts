import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, name, message, voiceMessageUrl, donationType } = await req.json();

    console.log('[ABdevil Order] Creating order:', { amount, name, donationType });

    // Validate minimum amounts
    if (donationType === 'hyperemote' && amount < 50) {
      throw new Error('Minimum amount for hyperemote is ₹50');
    }
    if (donationType === 'voice' && amount < 150) {
      throw new Error('Minimum amount for voice message is ₹150');
    }
    if (donationType === 'text' && amount < 40) {
      throw new Error('Minimum amount for text message is ₹40');
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get streamer ID
    const { data: streamerData, error: streamerError } = await supabase
      .from("streamers")
      .select("id")
      .eq("streamer_slug", "abdevil")
      .single();

    if (streamerError || !streamerData) {
      console.error('[ABdevil Order] Streamer not found:', streamerError);
      throw new Error("ABdevil streamer not found");
    }

    const streamerId = streamerData.id;

    // Generate internal order ID
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const internalOrderId = `abd_rp_${timestamp}_${randomStr}`;

    console.log('[ABdevil Order] Generated internal order ID:', internalOrderId);

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
        receipt: internalOrderId,
      }),
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error('Razorpay API error:', errorText);
      throw new Error('Failed to create Razorpay order');
    }

    const razorpayOrder = await razorpayResponse.json();

    console.log('[ABdevil Order] Razorpay order created:', razorpayOrder.id);

    // Insert donation record with PENDING status
    const { data: donationData, error: insertError } = await supabase
      .from("abdevil_donations")
      .insert({
        name: name,
        amount: amount,
        message: message || null,
        voice_message_url: voiceMessageUrl || null,
        is_hyperemote: donationType === 'hyperemote',
        order_id: internalOrderId,
        razorpay_order_id: razorpayOrder.id,
        payment_status: "pending",
        moderation_status: "pending",
        streamer_id: streamerId,
        message_visible: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[ABdevil Order] Insert error:', insertError);
      throw insertError;
    }

    console.log('[ABdevil Order] Donation record created:', donationData.id);

    return new Response(
      JSON.stringify({
        orderId: internalOrderId,
        razorpay_order_id: razorpayOrder.id,
        razorpay_key_id: razorpayKeyId,
        amount: amount,
        currency: "INR",
        internalOrderId: internalOrderId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[ABdevil Order] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});