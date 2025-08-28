import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, amount, message, isHyperemote, voiceData } = await req.json();

    if (!name || !amount) {
      throw new Error("Name and amount are required");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get streamer info
    const { data: streamer, error: streamerError } = await supabaseAdmin
      .from('streamers')
      .select('id, hyperemotes_enabled, hyperemotes_min_amount')
      .eq('streamer_slug', 'newstreamer')
      .single();

    if (streamerError || !streamer) {
      throw new Error("Streamer not found");
    }

    // Check hyperemote eligibility
    if (isHyperemote && (!streamer.hyperemotes_enabled || amount < streamer.hyperemotes_min_amount)) {
      throw new Error(`Hyperemotes require minimum ₹${streamer.hyperemotes_min_amount} donation`);
    }

    // Generate unique order ID
    const orderId = `newstreamer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create payment order with Cashfree
    const cashfreeCredentials = {
      clientId: Deno.env.get('XClientId'),
      clientSecret: Deno.env.get('XClientSecret'),
      apiUrl: Deno.env.get('api_url') || 'https://sandbox.cashfree.com/pg'
    };

    if (!cashfreeCredentials.clientId || !cashfreeCredentials.clientSecret) {
      throw new Error("Payment gateway credentials not configured");
    }

    const orderData = {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: `newstreamer_${Date.now()}`,
        customer_name: name,
        customer_email: `${name.replace(/\s+/g, '')}@example.com`,
        customer_phone: "9999999999"
      },
      order_meta: {
        return_url: `${req.headers.get('origin')}/newstreamer?payment=success&order_id=${orderId}`,
        notify_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/check-payment-status-newstreamer`
      },
      order_tags: {
        streamer: "newstreamer",
        type: isHyperemote ? "hyperemote" : "donation"
      }
    };

    const response = await fetch(`${cashfreeCredentials.apiUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': cashfreeCredentials.clientId,
        'x-client-secret': cashfreeCredentials.clientSecret,
        'x-api-version': '2023-08-01'
      },
      body: JSON.stringify(orderData)
    });

    const paymentOrder = await response.json();
    
    if (!response.ok) {
      throw new Error(`Payment gateway error: ${paymentOrder.message || 'Unknown error'}`);
    }

    // Store donation in database
    const { data: donation, error: donationError } = await supabaseAdmin
      .from('newstreamer_donations')
      .insert({
        streamer_id: streamer.id,
        name,
        amount,
        message,
        order_id: orderId,
        cashfree_order_id: paymentOrder.order_id,
        payment_status: 'pending',
        moderation_status: isHyperemote ? 'auto_approved' : 'pending',
        is_hyperemote: isHyperemote,
        temp_voice_data: voiceData,
        message_visible: true
      })
      .select()
      .single();

    if (donationError) {
      throw new Error(`Database error: ${donationError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: orderId,
        payment_session_id: paymentOrder.payment_session_id,
        payment_url: paymentOrder.payment_links?.web || paymentOrder.payment_link,
        donation_id: donation.id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error creating payment order:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});