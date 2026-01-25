import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

console.log('notify-new-donations: loaded with moderation support');

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting notification check for new donations...');

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      console.log('TELEGRAM_BOT_TOKEN not configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'Telegram bot token not configured'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Active donation tables only (3 streamers)
    const donationTables = [
      'ankit_donations',
      'chiaa_gaming_donations',
      'looteriya_gaming_donations',
    ];

    let donationsToNotify: any[] = [];

    // Query each table
    for (const tableName of donationTables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .eq('payment_status', 'success')
          .eq('mod_notified', false)
          .not('streamer_id', 'is', null);

        if (!error && data && data.length > 0) {
          const donationsWithTable = data.map(d => ({ ...d, source_table: tableName }));
          donationsToNotify = [...donationsToNotify, ...donationsWithTable];
          console.log(`Found ${data.length} donations from ${tableName}`);
        }
      } catch (err) {
        console.error(`Exception querying ${tableName}:`, err);
      }
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

    console.log(`Found ${donationsToNotify.length} donations that need notification`);

    let notifiedCount = 0;
    let errorCount = 0;

    for (const donation of donationsToNotify) {
      try {
        // Get streamer settings
        const { data: streamer, error: streamerError } = await supabaseAdmin
          .from('streamers')
          .select('id, streamer_slug, streamer_name, moderation_mode, telegram_moderation_enabled')
          .eq('id', donation.streamer_id)
          .single();

        if (streamerError || !streamer) {
          console.log(`Streamer not found for donation ${donation.id}`);
          continue;
        }

        // Skip if telegram moderation is disabled
        if (!streamer.telegram_moderation_enabled) {
          // Mark as notified to avoid retry
          await supabaseAdmin
            .from(donation.source_table)
            .update({ mod_notified: true })
            .eq('id', donation.id);
          continue;
        }

        // Get moderators
        const { data: moderators, error: modError } = await supabaseAdmin
          .from('streamers_moderators')
          .select('telegram_user_id, mod_name, role, can_approve, can_reject, can_hide_message, can_ban')
          .eq('streamer_id', donation.streamer_id)
          .eq('is_active', true);

        if (modError || !moderators || moderators.length === 0) {
          console.log(`No active moderators for streamer: ${donation.streamer_id}`);
          await supabaseAdmin
            .from(donation.source_table)
            .update({ mod_notified: true })
            .eq('id', donation.id);
          continue;
        }

        const isManualMode = streamer.moderation_mode === 'manual';
        const isPending = donation.moderation_status === 'pending';

        // Build message
        const statusEmoji = isPending ? '⏳' : '✅';
        const statusText = isPending ? 'Pending Approval' : 'Auto-Approved';
        
        let messageText = isManualMode && isPending
          ? `🎁 <b>New Donation - Needs Approval</b> 🎁\n\n`
          : `🎁 <b>New Donation Received!</b> 🎁\n\n`;
        
        messageText += `💰 <b>Amount:</b> ₹${donation.amount}\n`;
        messageText += `👤 <b>From:</b> ${donation.name}\n`;
        messageText += `📅 <b>Time:</b> ${new Date(donation.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n`;
        
        if (donation.message) {
          messageText += `💬 <b>Message:</b> ${donation.message.substring(0, 200)}${donation.message.length > 200 ? '...' : ''}\n`;
        }
        
        if (donation.voice_message_url) {
          messageText += `🎵 <b>Voice:</b> Available\n`;
        }
        
        messageText += `\n${statusEmoji} <i>${statusText}</i>`;

        let notificationSent = false;

        for (const moderator of moderators) {
          try {
            // Build keyboard based on mode and permissions
            const keyboard: any[][] = [];
            
            if (isManualMode && isPending) {
              // Row 1: Approve/Reject for pending manual mode
              const row1: any[] = [];
              if (moderator.role === 'owner' || moderator.can_approve) {
                row1.push({ text: '✅ Approve', callback_data: `approve_${donation.id}_${donation.source_table}` });
              }
              if (moderator.role === 'owner' || moderator.can_reject) {
                row1.push({ text: '❌ Reject', callback_data: `reject_${donation.id}_${donation.source_table}` });
              }
              if (row1.length > 0) keyboard.push(row1);

              // Row 2: Hide/Ban
              const row2: any[] = [];
              if ((moderator.role === 'owner' || moderator.can_hide_message) && donation.message) {
                row2.push({ text: '🙈 Hide Msg', callback_data: `hide_message_${donation.id}_${donation.source_table}` });
              }
              if (moderator.role === 'owner' || moderator.can_ban) {
                row2.push({ text: '🚫 Ban', callback_data: `ban_donor_${donation.id}_${donation.source_table}` });
              }
              if (row2.length > 0) keyboard.push(row2);
            } else {
              // For auto-approved: show replay and hide options
              const row: any[] = [];
              if (donation.message && (moderator.role === 'owner' || moderator.can_hide_message)) {
                row.push({ text: '🙈 Hide Msg', callback_data: `hide_message_${donation.id}_${donation.source_table}` });
              }
              row.push({ text: '🔄 Replay', callback_data: `replay_${donation.id}_${donation.source_table}` });
              if (row.length > 0) keyboard.push(row);
            }

            // Dashboard link
            keyboard.push([{ text: '📊 Dashboard', url: `https://hyperchat.site/dashboard/${streamer.streamer_slug}` }]);

            const payload: any = {
              chat_id: parseInt(moderator.telegram_user_id),
              text: messageText,
              parse_mode: 'HTML',
              disable_web_page_preview: true
            };

            if (keyboard.length > 0) {
              payload.reply_markup = { inline_keyboard: keyboard };
            }

            console.log(`Sending to ${moderator.mod_name} (${moderator.telegram_user_id})`);

            const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            if (resp.ok) {
              console.log(`Sent to ${moderator.mod_name}`);
              notificationSent = true;
            } else {
              const errText = await resp.text();
              console.error(`Failed for ${moderator.mod_name}:`, errText);
            }
          } catch (e) {
            console.error(`Error notifying ${moderator.mod_name}:`, e);
          }
        }

        // Mark as notified
        if (notificationSent) {
          await supabaseAdmin
            .from(donation.source_table)
            .update({ mod_notified: true })
            .eq('id', donation.id);
          notifiedCount++;
        } else {
          errorCount++;
        }

        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing donation ${donation.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Completed: ${notifiedCount} notified, ${errorCount} errors`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Notification process completed',
      notified: notifiedCount,
      errors: errorCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in notify-new-donations:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
