import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("Starting pending payment verification for newstreamer...");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get payment gateway credentials
    const cashfreeCredentials = {
      clientId: Deno.env.get('XClientId'),
      clientSecret: Deno.env.get('XClientSecret'),
      apiUrl: Deno.env.get('api_url') || 'https://sandbox.cashfree.com/pg'
    };

    if (!cashfreeCredentials.clientId || !cashfreeCredentials.clientSecret) {
      throw new Error("Payment gateway credentials not configured");
    }

    // Get pending donations older than 10 minutes that haven't been verified recently
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000).toISOString();

    const { data: pendingDonations, error: fetchError } = await supabaseAdmin
      .from('newstreamer_donations')
      .select('*')
      .eq('payment_status', 'pending')
      .lt('created_at', tenMinutesAgo)
      .or(`last_verification_attempt.is.null,last_verification_attempt.lt.${oneMinuteAgo}`);

    if (fetchError) {
      throw new Error(`Database fetch error: ${fetchError.message}`);
    }

    if (!pendingDonations || pendingDonations.length === 0) {
      console.log("No pending donations to verify");
      return new Response(
        JSON.stringify({
          success: true,
          message: "No pending donations to verify",
          processed: 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${pendingDonations.length} pending donations to verify`);

    let processed = 0;
    let updated = 0;
    let errors = 0;

    for (const donation of pendingDonations) {
      try {
        processed++;
        
        // Update last verification attempt
        await supabaseAdmin
          .from('newstreamer_donations')
          .update({ last_verification_attempt: new Date().toISOString() })
          .eq('id', donation.id);

        // Check payment status with Cashfree
        const orderId = donation.cashfree_order_id || donation.order_id;
        const statusResponse = await fetch(
          `${cashfreeCredentials.apiUrl}/orders/${orderId}`,
          {
            method: 'GET',
            headers: {
              'x-client-id': cashfreeCredentials.clientId,
              'x-client-secret': cashfreeCredentials.clientSecret,
              'x-api-version': '2023-08-01'
            }
          }
        );

        if (!statusResponse.ok) {
          console.error(`Payment gateway error for donation ${donation.id}`);
          errors++;
          continue;
        }

        const paymentStatus = await statusResponse.json();
        let newStatus = 'pending';
        
        if (paymentStatus.order_status === 'PAID') {
          newStatus = 'paid';
        } else if (paymentStatus.order_status === 'EXPIRED' || paymentStatus.order_status === 'CANCELLED') {
          newStatus = 'cancelled';
        } else if (paymentStatus.order_status === 'FAILED') {
          newStatus = 'failed';
        }

        if (newStatus !== 'pending') {
          // Update donation status
          const { error: updateError } = await supabaseAdmin
            .from('newstreamer_donations')
            .update({ 
              payment_status: newStatus,
              auto_verified: true 
            })
            .eq('id', donation.id);

          if (updateError) {
            console.error(`Error updating donation ${donation.id}:`, updateError);
            errors++;
            continue;
          }

          updated++;
          console.log(`Updated donation ${donation.id} to status: ${newStatus}`);

          // If payment successful and has voice data, trigger voice upload
          if (newStatus === 'paid' && donation.temp_voice_data) {
            try {
              await supabaseAdmin.functions.invoke('upload-voice-message-newstreamer', {
                body: { donation_id: donation.id }
              });
            } catch (voiceError) {
              console.error(`Error triggering voice upload for donation ${donation.id}:`, voiceError);
            }
          }

          // If payment successful, trigger moderator notification
          if (newStatus === 'paid') {
            try {
              await supabaseAdmin.functions.invoke('notify-moderators-newstreamer', {
                body: { donation_id: donation.id }
              });
            } catch (notifyError) {
              console.error(`Error triggering moderator notification for donation ${donation.id}:`, notifyError);
            }
          }
        }

      } catch (error) {
        console.error(`Error processing donation ${donation.id}:`, error);
        errors++;
      }
    }

    console.log(`Verification complete: ${processed} processed, ${updated} updated, ${errors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verification completed",
        processed,
        updated,
        errors
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error in verify-pending-payments-newstreamer:', error);
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