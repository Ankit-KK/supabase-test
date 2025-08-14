import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { order_id } = await req.json();

    if (!order_id) {
      throw new Error('Order ID is required');
    }

    // Get payment gateway credentials
    const clientId = Deno.env.get('XClientId');
    const clientSecret = Deno.env.get('XClientSecret');
    const apiUrl = Deno.env.get('api_url');

    if (!clientId || !clientSecret || !apiUrl) {
      throw new Error('Payment gateway not configured');
    }

    console.log('Checking payment status for order:', order_id);

    // Check payment status with Cashfree
    const response = await fetch(`${apiUrl}/pg/orders/${order_id}/payments`, {
      method: 'GET',
      headers: {
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'Accept': 'application/json',
        'x-api-version': '2023-08-01'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cashfree API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Payment status check failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Payment status response:', result);

    // Also get order details
    const orderResponse = await fetch(`${apiUrl}/pg/orders/${order_id}`, {
      method: 'GET',
      headers: {
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'Accept': 'application/json',
        'x-api-version': '2023-08-01'
      }
    });

    let orderDetails = null;
    if (orderResponse.ok) {
      orderDetails = await orderResponse.json();
    }

    // Determine final status
    let finalStatus = 'failure';
    if (result && result.length > 0) {
      const successfulPayment = result.find((payment: any) => payment.payment_status === "SUCCESS");
      const pendingPayment = result.find((payment: any) => payment.payment_status === "PENDING");
      
      if (successfulPayment) {
        finalStatus = 'success';
      } else if (pendingPayment) {
        finalStatus = 'pending';
      }
    }

    return new Response(JSON.stringify({
      success: true,
      order_id,
      payments: result,
      order_details: orderDetails,
      final_status: finalStatus,
      order_amount: orderDetails?.order_amount,
      customer_details: orderDetails?.customer_details
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in check-payment-status function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});