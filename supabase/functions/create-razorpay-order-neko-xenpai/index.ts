import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, amount, message, voiceMessageUrl, isHyperemote, selectedGifId } = await req.json();

    console.log('[Neko Xenpai] Creating Razorpay order:', { name, amount, isHyperemote });

    // Validate input
    if (!name || !amount || amount < 40) {
      throw new Error('Invalid donation details');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get streamer info
    const { data: streamer } = await supabase
      .from('streamers')
      .select('id')
      .eq('streamer_slug', 'neko_xenpai')
      .single();

    if (!streamer) {
      throw new Error('Streamer not found');
    }

    // Generate unique order ID with nx_rp_ prefix
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const orderId = `nx_rp_${timestamp}_${randomStr}`;

    // Create Razorpay order using direct fetch
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    const razorpayAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: orderId,
      }),
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error('[Neko Xenpai] Razorpay error:', errorText);
      throw new Error('Failed to create Razorpay order');
    }

    const razorpayOrder = await razorpayResponse.json();
    console.log('[Neko Xenpai] Razorpay order created:', razorpayOrder.id);

    // Store donation in database
    const { data: donation, error: dbError } = await supabase
      .from('neko_xenpai_donations')
      .insert({
        name,
        amount,
        message: message || null,
        voice_message_url: voiceMessageUrl || null,
        is_hyperemote: isHyperemote || false,
        selected_gif_id: selectedGifId || null,
        payment_status: 'pending',
        moderation_status: 'pending',
        order_id: orderId,
        razorpay_order_id: razorpayOrder.id,
        streamer_id: streamer.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[Neko Xenpai] Database error:', dbError);
      throw new Error('Failed to store donation');
    }

    console.log('[Neko Xenpai] Donation stored:', donation.id);

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
    console.error('[Neko Xenpai] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
