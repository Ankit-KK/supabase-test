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

    // First, get the donation record from our database - check both order_id and cashfree_order_id
    let { data: donationData, error: dbError } = await supabase
      .from('chia_gaming_donations')
      .select('*')
      .eq('order_id', order_id)
      .single();

    // If not found by order_id, try by cashfree_order_id
    if (dbError || !donationData) {
      const { data: cfData } = await supabase
        .from('chia_gaming_donations')
        .select('*')
        .eq('cashfree_order_id', order_id)
        .single();
      
      if (cfData) {
        donationData = cfData;
        dbError = null;
      }
    }

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

    // Use the original order_id (merchant order ID) for API calls, not cashfree_order_id
    const merchantOrderId = donationData.order_id || order_id;
    
    console.log('Using merchant order ID for API call:', merchantOrderId);

    // Check payment status with Cashfree using merchant order ID
    const response = await fetch(`${apiUrl}/orders/${merchantOrderId}/payments`, {
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
            .eq('id', donationData.id);
        }

        // If DB already shows success and moderation is pending, call notification service
        if (statusToReturn === 'success' && donationData.moderation_status === 'pending' && donationData.streamer_id && donationData.is_hyperemote !== true) {
          try {
            console.log(`Payment already successful for donation ${donationData.id}, triggering notification service`);
            
            // Call the notification service
            const notificationResponse = await supabase.functions.invoke('notify-pending-donations', {
              body: {}
            });
            
            if (notificationResponse.error) {
              console.error('Error calling notification service (404 path):', notificationResponse.error);
            } else {
              console.log('Notification service called successfully (404 path):', notificationResponse.data);
            }
          } catch (notifyErr) {
            console.error('Error calling notification service (404 path):', notifyErr);
          }
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

    // Also get order details using merchant order ID
    const orderResponse = await fetch(`${apiUrl}/orders/${merchantOrderId}`, {
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

      const previousStatus = donationData.payment_status || 'pending';
      // Update our database with the latest status using the correct identifier
      console.log(`Updating payment status from ${previousStatus} to ${finalStatus} for donation ${donationData.id}`);
      const { error: updateError } = await supabase
        .from('chia_gaming_donations')
        .update({ payment_status: finalStatus })
        .eq('id', donationData.id);
      
      if (updateError) {
        console.error('Failed to update payment status:', updateError);
      } else {
        console.log('Payment status updated successfully');
      }

      // If payment just transitioned to success, call notification service
      if (finalStatus === 'success' && previousStatus !== 'success' && donationData.moderation_status === 'pending' && donationData.is_hyperemote !== true) {
        try {
          console.log(`Payment succeeded for donation ${donationData.id}, triggering notification service`);
          
          // Call the notification service
          const notificationResponse = await supabase.functions.invoke('notify-pending-donations', {
            body: {}
          });
          
          if (notificationResponse.error) {
            console.error('Error calling notification service:', notificationResponse.error);
          } else {
            console.log('Notification service called successfully:', notificationResponse.data);
          }
        } catch (notifyErr) {
          console.error('Error calling notification service:', notifyErr);
        }
      }
    } else {
      // If no payments found and order exists in database, check current status
      if (donationData.payment_status === 'pending') {
        // Order exists but no payments - likely failed or expired
        finalStatus = 'failed';
        await supabase
          .from('chia_gaming_donations')
          .update({ payment_status: 'failed' })
          .eq('id', donationData.id);
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