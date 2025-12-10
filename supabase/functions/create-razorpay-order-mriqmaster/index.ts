import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Validate donation amounts based on type
    if (hypersoundUrl && amount < mins.hypersound) {
      throw new Error(`Minimum ${currency} ${mins.hypersound} required for HyperSounds`);
    }
    if (voiceMessageUrl && amount < mins.voice) {
      throw new Error(`Minimum ${currency} ${mins.voice} required for voice messages`);
    }
    if (!hypersoundUrl && !voiceMessageUrl && amount < mins.text) {
      throw new Error(`Minimum ${currency} ${mins.text} required for text messages`);
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
        currency: currency,
        message: message ? message.substring(0, 500) : null,
        voice_message_url: voiceMessageUrl || null,
        hypersound_url: hypersoundUrl || null,
        is_hyperemote: false,
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
