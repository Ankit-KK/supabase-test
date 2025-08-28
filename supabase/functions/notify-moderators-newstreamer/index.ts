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
    const { donation_id } = await req.json();
    
    if (!donation_id) {
      throw new Error("Donation ID is required");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get donation details
    const { data: donation, error: fetchError } = await supabaseAdmin
      .from('newstreamer_donations')
      .select('*')
      .eq('id', donation_id)
      .single();

    if (fetchError || !donation) {
      throw new Error("Donation not found");
    }

    // Check if already notified
    if (donation.mod_notified) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Moderators already notified"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Telegram bot token
    const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!telegramBotToken) {
      console.log('No Telegram bot token configured, skipping notification');
      return new Response(
        JSON.stringify({
          success: false,
          error: "Telegram bot not configured"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get active moderators for this streamer
    const { data: moderators, error: moderatorError } = await supabaseAdmin
      .from('streamers_moderators')
      .select('telegram_user_id')
      .eq('streamer_id', donation.streamer_id)
      .eq('is_active', true);

    if (moderatorError) {
      throw new Error(`Error fetching moderators: ${moderatorError.message}`);
    }

    if (!moderators || moderators.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No active moderators found"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create notification message with enhanced details
    const messageText = donation.message ? `💬 <b>Message:</b> ${donation.message}` : '';
    const voiceText = donation.voice_message_url ? `🎤 <b>Voice Message:</b> Available` : '';
    
    const notificationMessage = `
🔔 <b>New Donation Received!</b>

💰 <b>Amount:</b> ₹${donation.amount}
👤 <b>From:</b> ${donation.name}
📺 <b>Streamer:</b> New Streamer
${messageText}
${voiceText}
⏰ <b>Time:</b> ${new Date(donation.created_at).toLocaleString()}

Please review and approve/reject this donation.
    `.trim();

    // Create inline keyboard for actions
    const keyboard = {
      inline_keyboard: [
        [
          { text: "✅ Approve", callback_data: `approve_newstreamer_${donation.id}` },
          { text: "❌ Reject", callback_data: `reject_newstreamer_${donation.id}` }
        ]
      ]
    };

    // Add Play Voice button if voice message exists
    if (donation.voice_message_url) {
      keyboard.inline_keyboard.push([
        { text: "🎵 Play Voice", callback_data: `play_newstreamer_${donation.id}` }
      ]);
    }

    let notificationsSent = 0;

    // Send notification to each moderator
    for (const moderator of moderators) {
      if (moderator.telegram_user_id) {
        try {
          const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: moderator.telegram_user_id,
              text: notificationMessage,
              parse_mode: 'HTML',
              reply_markup: keyboard
            })
          });

          if (response.ok) {
            notificationsSent++;
          } else {
            const errorData = await response.json();
            console.error('Telegram API error:', errorData);
          }
        } catch (err) {
          console.error('Error sending Telegram message:', err);
        }
      }
    }

    // Mark as notified if at least one notification was sent
    if (notificationsSent > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('newstreamer_donations')
        .update({ mod_notified: true })
        .eq('id', donation_id);

      if (updateError) {
        console.error('Error updating mod_notified status:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notifications_sent: notificationsSent,
        total_moderators: moderators.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error notifying moderators:', error);
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