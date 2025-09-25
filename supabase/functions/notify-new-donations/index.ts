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
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting notification check for new donations...');

    // Create Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get bot token
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      console.log('TELEGRAM_BOT_TOKEN not configured, skipping notifications');
      return new Response(JSON.stringify({
        success: false,
        error: 'Telegram bot token not configured'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find successful donations that haven't been notified yet (since all are auto-approved now)
    const { data: donationsToNotify, error: fetchError } = await supabaseAdmin
      .from('chia_gaming_donations')
      .select('*')
      .eq('payment_status', 'success')
      .in('moderation_status', ['approved', 'auto_approved'])
      .eq('mod_notified', false)
      .not('streamer_id', 'is', null);

    if (fetchError) {
      console.error('Error fetching donations to notify:', fetchError);
      throw fetchError;
    }

    if (!donationsToNotify || donationsToNotify.length === 0) {
      console.log('No donations need notification');
      return new Response(JSON.stringify({
        success: true,
        message: 'No donations need notification',
        notified: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${donationsToNotify.length} donations that need moderator notification`);

    let notifiedCount = 0;
    let errorCount = 0;

    for (const donation of donationsToNotify) {
      try {
        // Get moderators for this streamer
        const { data: moderators, error: modError } = await supabaseAdmin
          .from('streamers_moderators')
          .select('telegram_user_id, mod_name')
          .eq('streamer_id', donation.streamer_id)
          .eq('is_active', true);

        if (modError || !moderators || moderators.length === 0) {
          console.log(`No active moderators found for streamer: ${donation.streamer_id}`);
          // Mark as notified even if no moderators to avoid retry loops
          await supabaseAdmin
            .from('chia_gaming_donations')
            .update({ mod_notified: true })
            .eq('id', donation.id);
          continue;
        }

        const messageText = `🎁 <b>New Donation Received!</b> 🎁\n\n` +
          `💰 <b>Amount:</b> ₹${donation.amount}\n` +
          `👤 <b>From:</b> ${donation.name}\n` +
          `📅 <b>Time:</b> ${new Date(donation.created_at).toLocaleString()}\n` +
          `${donation.message ? `💬 <b>Message:</b> ${donation.message}\n` : ''}` +
          `${donation.voice_message_url ? `🎵 <b>Voice Message:</b> Available\n` : ''}\n` +
          `✅ <i>Auto-approved and visible on stream</i>`;

        const keyboard = {
          inline_keyboard: [
            ...(donation.voice_message_url ? [[{ text: '🎵 Play Voice', callback_data: `play_${donation.id}` }]] : []),
            [{ text: '📊 Dashboard', callback_data: `dashboard_chia_gaming` }]
          ]
        };

        let notificationSent = false;

        for (const moderator of moderators) {
          try {
            const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
            const payload = {
              chat_id: parseInt(moderator.telegram_user_id),
              text: messageText,
              parse_mode: 'HTML',
              disable_web_page_preview: true,
              reply_markup: keyboard
            };

            console.log(`Sending notification to moderator ${moderator.mod_name} (${moderator.telegram_user_id}) for donation ${donation.id}`);

            const resp = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            if (!resp.ok) {
              const errText = await resp.text();
              console.error(`Error sending Telegram message to ${moderator.mod_name}:`, errText);
            } else {
              console.log(`Successfully sent notification to ${moderator.mod_name}`);
              notificationSent = true;
            }
          } catch (e) {
            console.error(`Error notifying moderator ${moderator.mod_name}:`, e);
          }
        }

        // Mark donation as notified
        if (notificationSent) {
          await supabaseAdmin
            .from('chia_gaming_donations')
            .update({ mod_notified: true })
            .eq('id', donation.id);
          notifiedCount++;
        } else {
          errorCount++;
        }

        // Add small delay to avoid overwhelming Telegram API
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing donation ${donation.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Notification process completed: ${notifiedCount} notified, ${errorCount} errors`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Notification process completed',
      notified: notifiedCount,
      errors: errorCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in notify-new-donations function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});