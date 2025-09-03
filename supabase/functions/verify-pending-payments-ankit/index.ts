import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    // Create Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get payment gateway credentials
    const clientId = Deno.env.get("XClientId");
    const clientSecret = Deno.env.get("XClientSecret");
    const apiUrl = Deno.env.get("api_url");
    
    if (!clientId || !clientSecret || !apiUrl) {
      throw new Error("Payment gateway not configured");
    }

    console.log('Starting pending payment verification for Ankit donations...');

    // Get pending donations older than 10 minutes that haven't been verified recently
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000).toISOString();

    const { data: pendingDonations, error } = await supabaseAdmin
      .from('ankit_donations')
      .select('*')
      .eq('payment_status', 'pending')
      .lt('created_at', tenMinutesAgo)
      .or(`last_verification_attempt.is.null,last_verification_attempt.lt.${oneMinuteAgo}`);

    if (error) {
      console.error('Error fetching pending donations:', error);
      throw error;
    }

    if (!pendingDonations || pendingDonations.length === 0) {
      console.log('No pending donations to verify');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending donations to verify',
          processed: 0,
          updated: 0,
          errors: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${pendingDonations.length} pending donations to verify`);

    let processedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    // Verify each pending donation
    for (const donation of pendingDonations) {
      try {
        processedCount++;
        
        // Update last verification attempt
        await supabaseAdmin
          .from('ankit_donations')
          .update({ last_verification_attempt: new Date().toISOString() })
          .eq('id', donation.id);

        // Check payment status with Cashfree
        const statusResponse = await fetch(`${apiUrl}/orders/${donation.cashfree_order_id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-client-id": clientId,
            "x-client-secret": clientSecret,
            "x-api-version": "2023-08-01"
          }
        });

        if (!statusResponse.ok) {
          console.log(`Payment gateway error for ${donation.order_id}: ${statusResponse.status}`);
          continue;
        }

        const statusResult = await statusResponse.json();
        const gatewayStatus = statusResult.order_status?.toLowerCase();
        
        let finalStatus = 'pending';
        if (gatewayStatus === 'paid') {
          finalStatus = 'success';
        } else if (gatewayStatus === 'cancelled') {
          finalStatus = 'cancelled';
        } else if (gatewayStatus === 'expired' || gatewayStatus === 'failed') {
          finalStatus = 'failed';
        }

        // Update status if changed
        if (finalStatus !== 'pending') {
          const { error: updateError } = await supabaseAdmin
            .from('ankit_donations')
            .update({ 
              payment_status: finalStatus,
              auto_verified: true
            })
            .eq('id', donation.id);

          if (updateError) {
            console.error(`Error updating donation ${donation.order_id}:`, updateError);
            errorCount++;
          } else {
            console.log(`Updated donation ${donation.order_id} status to: ${finalStatus}`);
            updatedCount++;

            // Notify moderators via Telegram if payment succeeded and needs moderation
            if (finalStatus === 'success' && donation.moderation_status === 'pending' && !donation.mod_notified) {
              console.log('Triggering Telegram notification for payment success');
              try {
                await supabaseAdmin.functions.invoke('notify-moderators-ankit', {
                  body: { donation_id: donation.id }
                });
                console.log('Telegram notification function invoked successfully');
              } catch (telegramError) {
                console.error('Error invoking Telegram notification function:', telegramError);
              }
            }

            // If payment is successful, trigger post-payment processing (TTS, voice upload, etc.)
            if (finalStatus === 'success') {
              try {
                console.log(`Triggering post-payment processing for ${donation.order_id}`);
                await supabaseAdmin.functions.invoke('process-ankit-payment', {
                  body: { donationId: donation.id }
                });
              } catch (processError) {
                console.error(`Post-payment processing error for ${donation.order_id}:`, processError);
              }
            }
          }
        }

      } catch (err) {
        console.error(`Error processing donation ${donation.order_id}:`, err);
        errorCount++;
      }
    }

    console.log(`Verification complete. Processed: ${processedCount}, Updated: ${updatedCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verification completed',
        processed: processedCount,
        updated: updatedCount,
        errors: errorCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error verifying pending payments:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});