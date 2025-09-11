import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { name, amount, message, voiceData, voiceDuration, emotionTags } = await req.json();

    if (!name || !amount) {
      throw new Error('Missing required fields');
    }

    console.log(`Creating payment order for ${name}: ₹${amount}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get streamer info
    const { data: streamer } = await supabase
      .from('streamers')
      .select('id, hyperemotes_enabled, hyperemotes_min_amount')
      .eq('streamer_slug', 'demostreamer')
      .single();

    if (!streamer) {
      throw new Error('Streamer not found');
    }

    // Check if this is a hyperemote
    const isHyperemote = streamer.hyperemotes_enabled && 
                        amount >= streamer.hyperemotes_min_amount;

    // Generate order ID
    const timestamp = Date.now();
    const orderId = `demostreamer_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

    // Get payment gateway credentials
    const clientId = Deno.env.get('CASHFREE_CLIENT_ID');
    const clientSecret = Deno.env.get('CASHFREE_CLIENT_SECRET');
    const apiUrl = Deno.env.get('CASHFREE_API_URL') || 'https://sandbox-api.cashfree.com/pg';

    if (!clientId || !clientSecret) {
      throw new Error('Payment gateway not configured');
    }

    // Create Cashfree order
    const cashfreeOrderId = `CF_${orderId}`;
    const orderData = {
      order_id: cashfreeOrderId,
      order_amount: parseFloat(amount),
      order_currency: 'INR',
      customer_details: {
        customer_id: `donor_${timestamp}`,
        customer_name: name,
        customer_email: 'donor@example.com',
        customer_phone: '9999999999'
      },
      order_meta: {
        return_url: `${req.headers.get('origin')}/demostreamer?status=success&order_id=${orderId}`,
        notify_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/demostreamer-payment-webhook`
      },
      order_note: message || 'Demo Streamer Donation'
    };

    const response = await fetch(`${apiUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'x-api-version': '2023-08-01'
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cashfree API error:', errorText);
      throw new Error('Failed to create payment order');
    }

    const paymentOrder = await response.json();

    // Store donation in database
    const { data: donation, error: insertError } = await supabase
      .from('demostreamer_donations')
      .insert({
        streamer_id: streamer.id,
        name,
        amount: parseFloat(amount),
        message,
        order_id: orderId,
        cashfree_order_id: cashfreeOrderId,
        payment_status: 'pending',
        moderation_status: isHyperemote ? 'auto_approved' : 'pending',
        is_hyperemote: isHyperemote,
        temp_voice_data: voiceData,
        voice_duration_seconds: voiceDuration,
        emotion_tags: emotionTags
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database error:', insertError);
      throw new Error('Failed to save donation');
    }

    console.log(`Order created successfully: ${orderId}`);

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        paymentSessionId: paymentOrder.payment_session_id,
        cashfreeOrderId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in create-payment-order-demostreamer:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});