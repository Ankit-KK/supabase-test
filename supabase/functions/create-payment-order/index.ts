
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get environment variables
const XClientId = Deno.env.get("XClientId");
const XClientSecret = Deno.env.get("XClientSecret");
const API_VERSION = "2025-01-01";
const API_URL = "https://api.cashfree.com/pg";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify client ID and secret are available
    if (!XClientId || !XClientSecret) {
      return new Response(
        JSON.stringify({ error: "Missing API credentials" }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Parse request body
    const { orderId, amount, name } = await req.json();
    
    if (!orderId || !amount) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Get origin for return URL
    const origin = req.headers.get('origin') || 'https://hyperchat.space';

    // Prepare request to Cashfree API
    const orderData = {
      order_amount: amount,
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: name ? name.replace(/\s+/g, '_').toLowerCase().substring(0, 20) : "hyperchat_user",
        customer_phone: "9205013630" // Using a default number, in production this should be dynamic
      },
      order_meta: {
        return_url: `${origin}/status?order_id={order_id}`,
        notify_url: `${origin}/status`
      }
    };

    // Make request to Cashfree to create an order
    const response = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": XClientId,
        "x-client-secret": XClientSecret,
        "x-api-version": API_VERSION
      },
      body: JSON.stringify(orderData)
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error("Error from Cashfree:", responseData);
      return new Response(
        JSON.stringify({ error: "Failed to create order", details: responseData }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Return successful response with the payment session ID
    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ error: "Server error", message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
