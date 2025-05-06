
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
    const { orderId } = await req.json();
    
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Missing order ID" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Call Cashfree API to get order status
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "x-client-id": XClientId,
        "x-client-secret": XClientSecret,
        "x-api-version": API_VERSION
      }
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error("Error from Cashfree:", responseData);
      return new Response(
        JSON.stringify({ error: "Failed to verify payment", details: responseData }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Return order details
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
