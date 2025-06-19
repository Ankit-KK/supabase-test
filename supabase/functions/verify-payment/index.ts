
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
    console.log("Verifying payment - checking credentials");
    
    // Verify client ID and secret are available
    if (!XClientId || !XClientSecret) {
      console.error("Missing API credentials");
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
    console.log("Processing payment verification request");
    
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
    
    const { orderId } = parsedBody;
    
    if (!orderId) {
      console.error("Missing order ID");
      return new Response(
        JSON.stringify({ error: "Missing order ID" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log(`Verifying payment for order: ${orderId}`);

    // First get order details
    const orderResponse = await fetch(`${API_URL}/orders/${orderId}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "x-client-id": XClientId,
        "x-client-secret": XClientSecret,
        "x-api-version": API_VERSION
      }
    });

    const orderData = await orderResponse.json();
    
    if (!orderResponse.ok) {
      console.error("Error fetching order:", orderData);
      return new Response(
        JSON.stringify({ error: "Failed to fetch order details", details: orderData }),
        {
          status: orderResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log("Order data retrieved successfully");

    // Now get payment details for this order
    const paymentResponse = await fetch(`${API_URL}/orders/${orderId}/payments`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "x-client-id": XClientId,
        "x-client-secret": XClientSecret,
        "x-api-version": API_VERSION
      }
    });

    let paymentData = [];
    
    if (paymentResponse.ok) {
      paymentData = await paymentResponse.json();
      console.log("Payment data retrieved successfully");
    } else {
      console.error("Error fetching payment details, but continuing with order data");
    }

    // Implement Cashfree's official payment status logic
    let finalStatus = "FAILURE"; // Default to failure
    
    // Check for SUCCESS transactions first (highest priority)
    if (paymentData.length > 0 && paymentData.filter((transaction: any) => transaction.payment_status === "SUCCESS").length > 0) {
      finalStatus = "SUCCESS";
    } 
    // Check for PENDING transactions (medium priority)
    else if (paymentData.length > 0 && paymentData.filter((transaction: any) => transaction.payment_status === "PENDING").length > 0) {
      finalStatus = "PENDING";
    }
    // If order is PAID but no successful payment transactions, mark as success
    else if (orderData.order_status === "PAID") {
      finalStatus = "SUCCESS";
    }
    // If order is ACTIVE and no payments attempted yet, mark as pending
    else if (orderData.order_status === "ACTIVE" && paymentData.length === 0) {
      finalStatus = "PENDING";
    }
    // All other cases remain as FAILURE

    console.log(`Final payment status determined: ${finalStatus}`);

    // Prepare standardized response
    const responseData = {
      order: orderData,
      payments: paymentData,
      status: finalStatus,
      order_id: orderId,
      payment_verified: finalStatus === "SUCCESS",
      verification_timestamp: new Date().toISOString()
    };

    console.log("Returning payment verification result");

    // Return the standardized verification result
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
