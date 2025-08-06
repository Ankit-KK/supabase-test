import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Cashfree API credentials
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
    console.log("Starting payment status updater for Chiaa Gaming donations");

    // Get donations that need verification
    const { data: donations, error: fetchError } = await supabase
      .from('chiaa_gaming_donations')
      .select('*')
      .in('payment_status', ['pending', 'failed'])
      .eq('auto_verification_enabled', true)
      .lt('verification_attempts', 10) // Max 10 attempts
      .or(
        'last_verification_at.is.null,' +
        'last_verification_at.lt.' + new Date(Date.now() - getNextRetryInterval(0)).toISOString()
      )
      .order('created_at', { ascending: true })
      .limit(50); // Process max 50 at a time

    if (fetchError) {
      console.error("Error fetching donations:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch donations", details: fetchError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${donations?.length || 0} donations to verify`);

    let processedCount = 0;
    let successCount = 0;
    let failedCount = 0;

    for (const donation of donations || []) {
      try {
        console.log(`Verifying donation ${donation.id} with order_id ${donation.order_id}`);
        
        // Calculate next retry interval based on attempts
        const nextRetryInterval = getNextRetryInterval(donation.verification_attempts);
        const shouldRetry = !donation.last_verification_at || 
          new Date(donation.last_verification_at).getTime() < (Date.now() - nextRetryInterval);

        if (!shouldRetry) {
          console.log(`Skipping donation ${donation.id} - not ready for retry yet`);
          continue;
        }

        // Verify payment with Cashfree
        const verificationResult = await verifyPaymentWithCashfree(donation.order_id);
        
        if (!verificationResult) {
          console.error(`Failed to verify payment for order ${donation.order_id}`);
          
          // Update verification attempt
          await supabase
            .from('chiaa_gaming_donations')
            .update({
              verification_attempts: donation.verification_attempts + 1,
              last_verification_at: new Date().toISOString()
            })
            .eq('id', donation.id);
          
          failedCount++;
          continue;
        }

        // Update donation with verification result
        const updateData: any = {
          payment_status: verificationResult.status === 'SUCCESS' ? 'success' : 
                         verificationResult.status === 'PENDING' ? 'pending' : 'failed',
          verification_attempts: donation.verification_attempts + 1,
          last_verification_at: new Date().toISOString(),
          cashfree_order_data: verificationResult
        };

        // If payment became successful, trigger notification
        const shouldNotify = verificationResult.status === 'SUCCESS' && 
                           donation.payment_status !== 'success';

        const { error: updateError } = await supabase
          .from('chiaa_gaming_donations')
          .update(updateData)
          .eq('id', donation.id);

        if (updateError) {
          console.error(`Error updating donation ${donation.id}:`, updateError);
          failedCount++;
          continue;
        }

        console.log(`Updated donation ${donation.id} - status: ${updateData.payment_status}`);

        // Send Telegram notification for newly successful payments
        if (shouldNotify) {
          try {
            const { error: notificationError } = await supabase.functions.invoke('donation-notification', {
              body: {
                type: 'UPDATE',
                table: 'chiaa_gaming_donations',
                record: { ...donation, ...updateData }
              }
            });

            if (notificationError) {
              console.error('Failed to send notification:', notificationError);
            } else {
              console.log('Notification sent for newly verified donation');
            }
          } catch (notificationError) {
            console.error('Error sending notification:', notificationError);
          }
        }

        successCount++;
        processedCount++;

      } catch (error) {
        console.error(`Error processing donation ${donation.id}:`, error);
        failedCount++;
      }
    }

    console.log(`Payment verification complete. Processed: ${processedCount}, Success: ${successCount}, Failed: ${failedCount}`);

    return new Response(
      JSON.stringify({
        processed: processedCount,
        successful: successCount,
        failed: failedCount,
        message: "Payment status update completed"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Payment status updater error:", error);
    return new Response(
      JSON.stringify({ error: "Payment status updater failed", message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

// Helper function to calculate retry intervals (exponential backoff)
function getNextRetryInterval(attemptCount: number): number {
  const intervals = [
    1 * 60 * 1000,      // 1 minute
    5 * 60 * 1000,      // 5 minutes
    15 * 60 * 1000,     // 15 minutes
    60 * 60 * 1000,     // 1 hour
    6 * 60 * 60 * 1000, // 6 hours
    24 * 60 * 60 * 1000 // 24 hours
  ];
  
  return intervals[Math.min(attemptCount, intervals.length - 1)];
}

// Helper function to verify payment with Cashfree
async function verifyPaymentWithCashfree(orderId: string) {
  try {
    if (!XClientId || !XClientSecret) {
      console.error("Missing Cashfree credentials");
      return null;
    }

    // Get order details
    const orderResponse = await fetch(`${API_URL}/orders/${orderId}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "x-client-id": XClientId,
        "x-client-secret": XClientSecret,
        "x-api-version": API_VERSION
      }
    });

    if (!orderResponse.ok) {
      console.error(`Failed to fetch order ${orderId}:`, orderResponse.status);
      return null;
    }

    const orderData = await orderResponse.json();

    // Get payment details
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
    }

    // Determine final status using Cashfree's official logic
    let finalStatus = "FAILURE";
    
    if (paymentData.length > 0 && paymentData.filter((transaction: any) => transaction.payment_status === "SUCCESS").length > 0) {
      finalStatus = "SUCCESS";
    } else if (paymentData.length > 0 && paymentData.filter((transaction: any) => transaction.payment_status === "PENDING").length > 0) {
      finalStatus = "PENDING";
    } else if (orderData.order_status === "PAID") {
      finalStatus = "SUCCESS";
    } else if (orderData.order_status === "ACTIVE" && paymentData.length === 0) {
      finalStatus = "PENDING";
    }

    return {
      order: orderData,
      payments: paymentData,
      status: finalStatus,
      order_id: orderId,
      payment_verified: finalStatus === "SUCCESS",
      verification_timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error(`Error verifying payment for order ${orderId}:`, error);
    return null;
  }
}