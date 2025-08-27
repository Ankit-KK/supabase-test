import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user information from auth header (optional)
    let user = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      );
      
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;
    }

    const { name, amount, message, phone, streamer_slug } = await req.json();

    // Validate required fields
    if (!name || !amount || !streamer_slug) {
      throw new Error("Missing required fields: name, amount, streamer_slug");
    }

    // Validate amount
    const donationAmount = parseFloat(amount);
    if (isNaN(donationAmount) || donationAmount < 1 || donationAmount > 100000) {
      throw new Error("Invalid amount. Must be between ₹1 and ₹100,000");
    }

    // Validate phone number if provided
    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      throw new Error("Invalid phone number format");
    }

    // Get streamer information
    const { data: streamerData, error: streamerError } = await supabaseAdmin
      .rpc('get_public_streamer_info', { slug: streamer_slug });

    if (streamerError || !streamerData || streamerData.length === 0) {
      throw new Error("Streamer not found");
    }

    const streamer = streamerData[0];

    // Get payment gateway credentials
    const clientId = Deno.env.get("XClientId");
    const clientSecret = Deno.env.get("XClientSecret");
    const apiUrl = Deno.env.get("api_url");
    
    if (!clientId || !clientSecret || !apiUrl) {
      throw new Error("Payment gateway not configured");
    }

    // Generate unique order ID
    const orderId = `ankit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create payment order with Cashfree
    const paymentData = {
      order_id: orderId,
      order_amount: donationAmount,
      order_currency: "INR",
      customer_details: {
        customer_id: user?.id || `guest_${Date.now()}`,
        customer_name: name,
        customer_email: user?.email || "guest@example.com",
        customer_phone: phone || "9999999999"
      },
      order_note: message || "Donation to Ankit"
    };

    console.log('Creating payment order:', paymentData);

    const paymentResponse = await fetch(`${apiUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": clientId,
        "x-client-secret": clientSecret,
        "x-api-version": "2023-08-01"
      },
      body: JSON.stringify(paymentData)
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      console.error('Payment gateway error:', errorText);
      throw new Error("Failed to create payment order");
    }

    const paymentResult = await paymentResponse.json();
    console.log('Payment order created:', paymentResult);

    // Store donation in database
    const { data: donation, error: dbError } = await supabaseAdmin
      .from('ankit_donations')
      .insert({
        order_id: orderId,
        name: name,
        amount: donationAmount,
        message: message || null,
        streamer_id: streamer.id,
        cashfree_order_id: paymentResult.order_id,
        payment_status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error("Failed to store donation record");
    }

    console.log('Donation stored:', donation);

    return new Response(
      JSON.stringify({
        success: true,
        order_id: orderId,
        payment_session_id: paymentResult.payment_session_id,
        message: "Payment order created successfully"
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