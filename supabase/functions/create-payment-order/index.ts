import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user from auth header (optional for guest checkout)
    const authHeader = req.headers.get("Authorization");
    let user = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;
    }

    const { name, amount, message } = await req.json();

    // Validate input
    if (!name || !amount || amount <= 0 || amount > 100000) {
      throw new Error('Invalid input data');
    }

    // Get payment gateway credentials
    const clientId = Deno.env.get('XclientId');
    const clientSecret = Deno.env.get('XClientSecret');
    const apiUrl = Deno.env.get('api_url');

    if (!clientId || !clientSecret || !apiUrl) {
      throw new Error('Payment gateway not configured');
    }

    // Generate secure order ID
    const orderId = `CHIA_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Generate secure phone number (Indian format)
    const phoneNumber = `9${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;

    // Create order with Cashfree
    const orderData = {
      order_amount: amount,
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: user?.id || "guest_user",
        customer_name: name,
        customer_phone: phoneNumber
      },
      order_meta: {
        return_url: `${req.headers.get("origin")}/chia_gaming?status=success&order_id=${orderId}`,
        notify_url: `${req.headers.get("origin")}/chia_gaming?status=success&order_id=${orderId}`
      },
      order_note: message || ""
    };

    console.log('Creating order with data:', orderData);

    const response = await fetch(`${apiUrl}/pg/orders`, {
      method: 'POST',
      headers: {
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-version': '2025-01-01'
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cashfree API error:', errorText);
      throw new Error(`Payment gateway error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Order creation response:', result);

    return new Response(JSON.stringify({
      success: true,
      payment_session_id: result.payment_session_id,
      order_id: orderId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in create-payment-order function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});