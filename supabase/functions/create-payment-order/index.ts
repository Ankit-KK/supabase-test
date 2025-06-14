
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

// Function to generate a random 10-digit phone number
const generateRandomPhoneNumber = (): string => {
  // Generate a number between 7000000000 and 9999999999 (valid Indian mobile range)
  const min = 7000000000;
  const max = 9999999999;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Creating payment order - checking credentials");
    
    // Verify client ID and secret are available
    if (!XClientId || !XClientSecret) {
      console.error("Missing API credentials - XClientId or XClientSecret not found");
      return new Response(
        JSON.stringify({ error: "Missing API credentials" }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Parse request body
    const requestBody = await req.text();
    console.log("Raw request body:", requestBody);
    
    let parsedBody;
    try {
      parsedBody = JSON.parse(requestBody);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const { orderId, amount, name, donationType = "ankit" } = parsedBody;
    
    if (!orderId || !amount) {
      console.error("Missing required parameters:", { orderId, amount });
      return new Response(
        JSON.stringify({ error: "Missing required parameters: orderId and amount are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Get origin for return URL
    const origin = req.headers.get('origin') || 'https://hyperchat.space';
    console.log("Using origin for return URL:", origin);

    // Prepare request to Cashfree API
    const orderData = {
      order_amount: Number(amount),
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: name ? name.replace(/\s+/g, '_').toLowerCase().substring(0, 20) : "hyperchat_user",
        customer_phone: generateRandomPhoneNumber()
      },
      order_meta: {
        return_url: `${origin}/payment-status?order_id={order_id}`,
        notify_url: `${origin}/payment-status`
      }
    };

    console.log("Creating order with data:", JSON.stringify(orderData, null, 2));

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
    console.log("Cashfree API response:", JSON.stringify(responseData, null, 2));
    
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

    console.log("Order created successfully");
    
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
