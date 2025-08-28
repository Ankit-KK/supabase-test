import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();
    
    if (!order_id) {
      throw new Error("Order ID is required");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get donation record
    const { data: donation, error: fetchError } = await supabaseAdmin
      .from('newstreamer_donations')
      .select('*')
      .or(`order_id.eq.${order_id},cashfree_order_id.eq.${order_id}`)
      .single();

    if (fetchError || !donation) {
      throw new Error("Donation not found");
    }

    // Get payment gateway credentials
    const cashfreeCredentials = {
      clientId: Deno.env.get('XClientId'),
      clientSecret: Deno.env.get('XClientSecret'),
      apiUrl: Deno.env.get('api_url') || 'https://sandbox.cashfree.com/pg'
    };

    if (!cashfreeCredentials.clientId || !cashfreeCredentials.clientSecret) {
      throw new Error("Payment gateway credentials not configured");
    }

    // Check payment status with Cashfree
    const statusResponse = await fetch(
      `${cashfreeCredentials.apiUrl}/orders/${donation.cashfree_order_id || donation.order_id}`,
      {
        method: 'GET',
        headers: {
          'x-client-id': cashfreeCredentials.clientId,
          'x-client-secret': cashfreeCredentials.clientSecret,
          'x-api-version': '2023-08-01'
        }
      }
    );

    const paymentStatus = await statusResponse.json();
    
    if (!statusResponse.ok) {
      throw new Error(`Payment gateway error: ${paymentStatus.message || 'Unknown error'}`);
    }

    let newStatus = donation.payment_status;
    
    if (paymentStatus.order_status === 'PAID') {
      newStatus = 'paid';
    } else if (paymentStatus.order_status === 'EXPIRED' || paymentStatus.order_status === 'CANCELLED') {
      newStatus = 'cancelled';
    } else if (paymentStatus.order_status === 'FAILED') {
      newStatus = 'failed';
    }

    // Update donation status if changed
    if (newStatus !== donation.payment_status) {
      const { error: updateError } = await supabaseAdmin
        .from('newstreamer_donations')
        .update({ payment_status: newStatus })
        .eq('id', donation.id);

      if (updateError) {
        throw new Error(`Database update error: ${updateError.message}`);
      }

      // If payment is successful and not yet notified to moderators
      if (newStatus === 'paid' && !donation.mod_notified) {
        try {
          await supabaseAdmin.functions.invoke('notify-moderators-newstreamer', {
            body: { donation_id: donation.id }
          });
        } catch (notifyError) {
          console.error('Error notifying moderators:', notifyError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_status: newStatus,
        order_status: paymentStatus.order_status,
        donation_id: donation.id,
        amount: donation.amount,
        name: donation.name
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error checking payment status:', error);
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