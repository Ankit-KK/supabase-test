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
      return { success: false, error: 'No bot token' };
    }

    // Get active moderators for this streamer
    const { data: moderators, error } = await supabase
      .from('streamers_moderators')
      .select('telegram_user_id, mod_name')
      .eq('streamer_id', streamerId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching moderators:', error);
      return { success: false, error: 'Failed to fetch moderators' };
    }

    if (!moderators || moderators.length === 0) {
      console.log('No active moderators found for streamer:', streamerId);
      return { success: false, error: 'No moderators found' };
    }

    console.log(`Found ${moderators.length} moderators for notification`);

    let successCount = 0;
    let errorCount = 0;

    // Send message to each moderator
    for (const moderator of moderators) {
      if (moderator.telegram_user_id) {
        try {
          console.log(`Sending Telegram notification to moderator ${moderator.mod_name} (${moderator.telegram_user_id})`);
          
          const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: moderator.telegram_user_id,
              text: message,
              parse_mode: 'HTML'
            })
          });

          const result = await response.json();
          
          if (response.ok) {
            console.log(`Successfully sent message to ${moderator.mod_name}`);
            successCount++;
          } else {
            console.error(`Failed to send message to ${moderator.mod_name}:`, result);
            errorCount++;
          }
        } catch (err) {
          console.error(`Error sending Telegram message to ${moderator.mod_name}:`, err);
          errorCount++;
        }
      }
    }

    return { 
      success: successCount > 0, 
      successCount, 
      errorCount, 
      totalModerators: moderators.length 
    };
  } catch (error) {
    console.error('Error in notifyTelegramModerators:', error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { streamer_id } = await req.json();
    
    if (!streamer_id) {
      throw new Error("Streamer ID is required");
    }

    // Create Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log('Fetching pending donations for streamer:', streamer_id);

    // Get all pending donations for this streamer
    const { data: pendingDonations, error: fetchError } = await supabaseAdmin
      .from('ankit_donations')
      .select('*')
      .eq('streamer_id', streamer_id)
      .eq('payment_status', 'success')
      .eq('moderation_status', 'pending')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching pending donations:', fetchError);
      throw fetchError;
    }

    if (!pendingDonations || pendingDonations.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No pending donations found',
          count: 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${pendingDonations.length} pending donations`);

    let notificationResults = [];

    // Send notification for each pending donation
    for (const donation of pendingDonations) {
      const notificationMessage = `
🚨 <b>Pending Donation for Ankit!</b>

💰 <b>Amount:</b> ₹${donation.amount}
👤 <b>From:</b> ${donation.name}
💬 <b>Message:</b> ${donation.message || 'No message'}
📅 <b>Date:</b> ${new Date(donation.created_at).toLocaleString()}

Please approve or reject this donation in the dashboard or use Telegram commands:
/pending - See all pending donations
      `.trim();
      
      console.log(`Sending notification for donation ${donation.id}`);
      const result = await notifyTelegramModerators(donation.streamer_id, notificationMessage, supabaseAdmin);
      
      notificationResults.push({
        donation_id: donation.id,
        amount: donation.amount,
        name: donation.name,
        notification_result: result
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${pendingDonations.length} pending donations`,
        count: pendingDonations.length,
        results: notificationResults
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error in notify pending donations:', error);
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