import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting verification of pending payments for demostreamer');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get payment gateway credentials
    const clientId = Deno.env.get('CASHFREE_CLIENT_ID');
    const clientSecret = Deno.env.get('CASHFREE_CLIENT_SECRET');
    const apiUrl = Deno.env.get('CASHFREE_API_URL') || 'https://sandbox-api.cashfree.com/pg';

    if (!clientId || !clientSecret) {
      throw new Error('Payment gateway credentials not configured');
    }

    // Get pending donations older than 10 minutes and not recently verified
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data: pendingDonations, error: fetchError } = await supabase
      .from('demostreamer_donations')
      .select('*')
      .eq('payment_status', 'pending')
      .lt('created_at', tenMinutesAgo)
      .or(`last_verification_attempt.is.null,last_verification_attempt.lt.${fiveMinutesAgo}`);

    if (fetchError) {
      throw new Error(`Failed to fetch pending donations: ${fetchError.message}`);
    }

    console.log(`Found ${pendingDonations?.length || 0} pending donations to verify`);

    let processedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const donation of pendingDonations || []) {
      try {
        processedCount++;

        // Update last verification attempt
        await supabase
          .from('demostreamer_donations')
          .update({ last_verification_attempt: new Date().toISOString() })
          .eq('id', donation.id);

        // Check payment status with Cashfree
        const response = await fetch(`${apiUrl}/orders/${donation.cashfree_order_id}`, {
          method: 'GET',
          headers: {
            'x-client-id': clientId,
            'x-client-secret': clientSecret,
            'x-api-version': '2023-08-01'
          }
        });

        if (!response.ok) {
          console.error(`Failed to check status for order ${donation.cashfree_order_id}:`, await response.text());
          errorCount++;
          continue;
        }

        const paymentData = await response.json();
        const paymentStatus = paymentData.order_status?.toLowerCase();

        console.log(`Order ${donation.cashfree_order_id} status: ${paymentStatus}`);

        // Determine new status
        let newStatus = 'pending';
        if (paymentStatus === 'paid') {
          newStatus = 'success';
        } else if (['cancelled', 'failed', 'expired'].includes(paymentStatus)) {
          newStatus = paymentStatus === 'cancelled' ? 'cancelled' : 'failed';
        }

        // Update database if status changed
        if (newStatus !== donation.payment_status) {
          const { error: updateError } = await supabase
            .from('demostreamer_donations')
            .update({ 
              payment_status: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', donation.id);

          if (updateError) {
            console.error(`Failed to update donation ${donation.id}:`, updateError);
            errorCount++;
            continue;
          }

          updatedCount++;
          console.log(`Updated donation ${donation.id} status to: ${newStatus}`);

          // If payment successful, trigger additional processing
          if (newStatus === 'success') {
            // Trigger moderator notification if needed
            if (donation.moderation_status === 'pending' && !donation.is_hyperemote) {
              supabase.functions.invoke('notify-moderators-demostreamer', {
                body: { donation_id: donation.id }
              }).catch(err => console.error('Failed to notify moderators:', err));
            }

            // Trigger post-payment processing
            supabase.functions.invoke('process-demostreamer-payment', {
              body: { donationId: donation.id }
            }).catch(err => console.error('Failed to process payment:', err));
          }
        }

      } catch (error) {
        console.error(`Error processing donation ${donation.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Verification complete. Processed: ${processedCount}, Updated: ${updatedCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed_count: processedCount,
        updated_count: updatedCount,
        error_count: errorCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in verify-pending-payments-demostreamer:', error);
    
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