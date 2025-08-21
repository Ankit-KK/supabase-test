import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

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

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Checking payment status for order:', order_id);

    // First, get the Cashfree order ID from our database
    const { data: donationData, error: dbError } = await supabase
      .from('chia_gaming_donations')
      .select('*')
      .eq('order_id', order_id)
      .single();

    if (dbError || !donationData) {
      console.error('Database error or donation not found:', dbError);
      // Return the current status from our database if available
      return new Response(JSON.stringify({
        success: true,
        order_id,
        payments: [],
        final_status: 'failure',
        error: 'Donation record not found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get payment gateway credentials
    const clientId = Deno.env.get('XClientId');
    const clientSecret = Deno.env.get('XClientSecret');
    const apiUrl = Deno.env.get('api_url');

    if (!clientId || !clientSecret || !apiUrl) {
      throw new Error('Payment gateway not configured');
    }

    // Use the stored Cashfree order ID for API calls
    let cashfreeOrderId = donationData.cashfree_order_id;
    
    if (!cashfreeOrderId) {
      console.log('No Cashfree order ID found, falling back to custom order ID');
      cashfreeOrderId = order_id;
    }

    console.log('Using Cashfree order ID:', cashfreeOrderId);

    // Check payment status with Cashfree
    const response = await fetch(`${apiUrl}/orders/${cashfreeOrderId}/payments`, {
      method: 'GET',
      headers: {
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'Accept': 'application/json',
        'x-api-version': '2025-01-01'
      }
    });

    let result = [];
    let orderDetails = null;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cashfree API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      // If it's a 404 (order not found), return the status from our database
      if (response.status === 404) {
        console.log('Order not found in Cashfree, returning database status');
        
        // If order not found in Cashfree and status is still pending, mark as failed
        let statusToReturn = donationData.payment_status || 'pending';
        if (statusToReturn === 'pending') {
          statusToReturn = 'failed';
          await supabase
            .from('chia_gaming_donations')
            .update({ payment_status: 'failed' })
            .eq('order_id', order_id);
        }
        
        return new Response(JSON.stringify({
          success: true,
          order_id,
          payments: [],
          final_status: statusToReturn,
          order_amount: donationData.amount,
          customer_details: {
            customer_name: donationData.name
          },
          message: donationData.message,
          database_status: statusToReturn
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Payment status check failed: ${response.status} - ${errorText}`);
    }

    result = await response.json();
    console.log('Payment status response:', result);

    // Also get order details
    const orderResponse = await fetch(`${apiUrl}/orders/${cashfreeOrderId}`, {
      method: 'GET',
      headers: {
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'Accept': 'application/json',
        'x-api-version': '2025-01-01'
      }
    });

    if (orderResponse.ok) {
      orderDetails = await orderResponse.json();
    }

    // Determine final status
    let finalStatus = 'failure';
    if (result && result.length > 0) {
      const successfulPayment = result.find((payment: any) => payment.payment_status === "SUCCESS");
      const pendingPayment = result.find((payment: any) => payment.payment_status === "PENDING");
      const cancelledPayment = result.find((payment: any) => payment.payment_status === "CANCELLED");
      const failedPayment = result.find((payment: any) => payment.payment_status === "FAILED");
      
      if (successfulPayment) {
        finalStatus = 'success';
      } else if (pendingPayment) {
        finalStatus = 'pending';
      } else if (cancelledPayment) {
        finalStatus = 'cancelled';
      } else if (failedPayment) {
        finalStatus = 'failed';
      }

      // Update our database with the latest status
      await supabase
        .from('chia_gaming_donations')
        .update({ payment_status: finalStatus })
        .eq('order_id', order_id);
    } else {
      // If no payments found and order exists in database, check current status
      if (donationData.payment_status === 'pending') {
        // Order exists but no payments - likely failed or expired
        finalStatus = 'failed';
        await supabase
          .from('chia_gaming_donations')
          .update({ payment_status: 'failed' })
          .eq('order_id', order_id);
      } else {
        // Use existing database status
        finalStatus = donationData.payment_status;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      order_id,
      payments: result,
      order_details: orderDetails,
      final_status: finalStatus,
      order_amount: orderDetails?.order_amount || donationData.amount,
      customer_details: orderDetails?.customer_details || {
        customer_name: donationData.name
      },
      message: donationData.message
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