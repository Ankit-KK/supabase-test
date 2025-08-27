import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to notify moderators via Telegram
async function notifyTelegramModerators(streamerId: string, message: string, supabase: any) {
  try {
    const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!telegramBotToken) {
      console.log('No Telegram bot token configured, skipping notification');
      return;
    }

    // Get active moderators for this streamer
    const { data: moderators, error } = await supabase
      .from('streamers_moderators')
      .select('telegram_user_id')
      .eq('streamer_id', streamerId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching moderators:', error);
      return;
    }

    // Send message to each moderator
    for (const moderator of moderators || []) {
      if (moderator.telegram_user_id) {
        try {
          await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: moderator.telegram_user_id,
              text: message,
              parse_mode: 'HTML'
            })
          });
        } catch (err) {
          console.error('Error sending Telegram message:', err);
        }
      }
    }
  } catch (error) {
    console.error('Error in notifyTelegramModerators:', error);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();
    
    if (!order_id) {
      throw new Error("Order ID is required");
    }

    // Create Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get donation record from database
    let { data: donation, error: fetchError } = await supabaseAdmin
      .from('ankit_donations')
      .select('*')
      .eq('order_id', order_id)
      .single();

    // If not found by order_id, try cashfree_order_id
    if (fetchError || !donation) {
      const { data: altDonation, error: altError } = await supabaseAdmin
        .from('ankit_donations')
        .select('*')
        .eq('cashfree_order_id', order_id)
        .single();
        
      if (altError || !altDonation) {
        throw new Error("Donation not found");
      }
      donation = altDonation;
    }

    // Get payment gateway credentials
    const clientId = Deno.env.get("XClientId");
    const clientSecret = Deno.env.get("XClientSecret");
    const apiUrl = Deno.env.get("api_url");
    
    if (!clientId || !clientSecret || !apiUrl) {
      throw new Error("Payment gateway not configured");
    }

    // Check payment status with Cashfree
    let paymentStatus = 'unknown';
    let customerDetails = null;
    
    try {
      const statusResponse = await fetch(`${apiUrl}/orders/${donation.cashfree_order_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": clientId,
          "x-client-secret": clientSecret,
          "x-api-version": "2023-08-01"
        }
      });

      if (statusResponse.status === 404) {
        // Order not found, mark as failed if currently pending
        if (donation.payment_status === 'pending') {
          await supabaseAdmin
            .from('ankit_donations')
            .update({ payment_status: 'failed' })
            .eq('id', donation.id);
        }
        paymentStatus = donation.payment_status || 'failed';
      } else if (statusResponse.ok) {
        const statusResult = await statusResponse.json();
        console.log('Payment status from gateway:', statusResult);
        
        customerDetails = statusResult.customer_details;
        
        // Map gateway status to our status
        const gatewayStatus = statusResult.order_status?.toLowerCase();
        let finalStatus = 'pending';
        
        if (gatewayStatus === 'paid') {
          finalStatus = 'success';
        } else if (gatewayStatus === 'active') {
          finalStatus = 'pending';
        } else if (gatewayStatus === 'cancelled') {
          finalStatus = 'cancelled';
        } else if (gatewayStatus === 'expired' || gatewayStatus === 'failed') {
          finalStatus = 'failed';
        }
        
        paymentStatus = finalStatus;
        
        // Update database if status changed
        if (donation.payment_status !== finalStatus) {
          const { error: updateError } = await supabaseAdmin
            .from('ankit_donations')
            .update({ payment_status: finalStatus })
            .eq('id', donation.id);
            
          if (updateError) {
            console.error('Error updating payment status:', updateError);
          } else {
            console.log(`Payment status updated to: ${finalStatus}`);
            
            // Notify moderators if payment is successful and needs moderation
            if (finalStatus === 'success' && donation.moderation_status === 'pending') {
              const notificationMessage = `
🎉 <b>New Donation for Ankit!</b>

💰 <b>Amount:</b> ₹${donation.amount}
👤 <b>From:</b> ${donation.name}
💬 <b>Message:</b> ${donation.message || 'No message'}

Please approve or reject this donation in the dashboard.
              `.trim();
              
              await notifyTelegramModerators(donation.streamer_id, notificationMessage, supabaseAdmin);
            }
          }
        }
      } else {
        throw new Error(`Payment gateway returned status: ${statusResponse.status}`);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      paymentStatus = donation.payment_status || 'unknown';
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_status: paymentStatus,
        order_details: {
          order_id: donation.order_id,
          amount: donation.amount,
          name: donation.name,
          message: donation.message,
          created_at: donation.created_at
        },
        customer_details: customerDetails
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