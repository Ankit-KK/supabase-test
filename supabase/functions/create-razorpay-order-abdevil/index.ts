import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, currency = 'INR', name, message, voiceMessageUrl, hypersoundUrl } = await req.json();

    console.log('[ABdevil Order] Creating order:', { amount, currency, name });

    const mins = CURRENCY_MINIMUMS[currency] || CURRENCY_MINIMUMS['INR'];

    // Validate minimum amounts based on type
    if (hypersoundUrl && amount < mins.hypersound) {
      throw new Error(`Minimum ${currency} ${mins.hypersound} required for HyperSounds`);
    }
    if (voiceMessageUrl && amount < mins.voice) {
      throw new Error(`Minimum ${currency} ${mins.voice} required for voice messages`);
    }
    if (!hypersoundUrl && !voiceMessageUrl && amount < mins.text) {
      throw new Error(`Minimum ${currency} ${mins.text} required for text messages`);
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

    // Calculate amount in subunits
    const amountInSubunits = Math.round(amount * 100);

    // Create Razorpay order
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
      },
      body: JSON.stringify({
        amount: amountInSubunits,
        currency: currency,
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
        currency: currency,
        message: message || null,
        voice_message_url: voiceMessageUrl || null,
        hypersound_url: hypersoundUrl || null,
        is_hyperemote: false,
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
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
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
