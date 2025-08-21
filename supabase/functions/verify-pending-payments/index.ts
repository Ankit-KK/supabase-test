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
    console.log('Starting pending payment verification...');

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get payment gateway credentials
    const clientId = Deno.env.get('XClientId');
    const clientSecret = Deno.env.get('XClientSecret');
    const apiUrl = Deno.env.get('api_url');

    if (!clientId || !clientSecret || !apiUrl) {
      throw new Error('Payment gateway not configured');
    }

    // Get pending donations older than 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: pendingDonations, error: fetchError } = await supabase
      .from('chia_gaming_donations')
      .select('*')
      .eq('payment_status', 'pending')
      .lt('created_at', tenMinutesAgo)
      .or(`last_verification_attempt.is.null,last_verification_attempt.lt.${thirtyMinutesAgo}`)
      .limit(20); // Process max 20 at a time to avoid timeout

    if (fetchError) {
      console.error('Error fetching pending donations:', fetchError);
      throw fetchError;
    }

    if (!pendingDonations || pendingDonations.length === 0) {
      console.log('No pending donations to verify');
      return new Response(JSON.stringify({
        success: true,
        message: 'No pending donations to verify',
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${pendingDonations.length} pending donations to verify`);

    let processedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const donation of pendingDonations) {
      try {
        // Update verification attempt timestamp
        await supabase
          .from('chia_gaming_donations')
          .update({ last_verification_attempt: new Date().toISOString() })
          .eq('id', donation.id);

        const cashfreeOrderId = donation.cashfree_order_id || donation.order_id;
        
        if (!cashfreeOrderId) {
          console.log(`Skipping donation ${donation.id}: no order ID found`);
          errorCount++;
          continue;
        }

        console.log(`Verifying payment for donation ${donation.id}, Cashfree order: ${cashfreeOrderId}`);

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

        if (!response.ok) {
          if (response.status === 404) {
            // Order not found in Cashfree - mark as failed
            console.log(`Order ${cashfreeOrderId} not found in Cashfree, marking as failed`);
            
            await supabase
              .from('chia_gaming_donations')
              .update({ 
                payment_status: 'failed', 
                auto_verified: true 
              })
              .eq('id', donation.id);
              
            updatedCount++;
          } else {
            console.error(`API error for donation ${donation.id}:`, response.status);
            errorCount++;
          }
          processedCount++;
          continue;
        }

        const payments = await response.json();
        
        // Determine status from payments
        let newStatus = 'failed';
        if (payments && payments.length > 0) {
          const successfulPayment = payments.find((payment: any) => payment.payment_status === "SUCCESS");
          const pendingPayment = payments.find((payment: any) => payment.payment_status === "PENDING");
          const cancelledPayment = payments.find((payment: any) => payment.payment_status === "CANCELLED");
          
          if (successfulPayment) {
            newStatus = 'success';
          } else if (pendingPayment) {
            newStatus = 'pending'; // Keep as pending
          } else if (cancelledPayment) {
            newStatus = 'cancelled';
          }
        }

        // Update donation status if changed
        if (newStatus !== donation.payment_status) {
          console.log(`Updating donation ${donation.id} status from ${donation.payment_status} to ${newStatus}`);
          
          await supabase
            .from('chia_gaming_donations')
            .update({ 
              payment_status: newStatus,
              auto_verified: true 
            })
            .eq('id', donation.id);

          // If payment is successful, trigger voice message upload
          if (newStatus === 'success' && donation.temp_voice_data) {
            try {
              console.log(`Triggering voice message upload for successful payment ${donation.order_id}`);
              
              await supabase.functions.invoke('upload-voice-message', {
                body: { order_id: donation.order_id }
              });
            } catch (voiceError) {
              console.error(`Error uploading voice message for ${donation.order_id}:`, voiceError);
            }
          }
          
          updatedCount++;
        } else {
          console.log(`No status change needed for donation ${donation.id}`);
        }

        processedCount++;

        // Add small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing donation ${donation.id}:`, error);
        errorCount++;
        processedCount++;
      }
    }

    console.log(`Verification completed: ${processedCount} processed, ${updatedCount} updated, ${errorCount} errors`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Payment verification completed',
      processed: processedCount,
      updated: updatedCount,
      errors: errorCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in verify-pending-payments function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});