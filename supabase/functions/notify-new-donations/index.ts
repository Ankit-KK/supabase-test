import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

console.log('notify-new-donations: loaded with media moderation support');

// Generate a short alphanumeric ID for callback mapping
function generateShortId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

// Create a shortened callback mapping in the database
async function createCallbackMapping(
  supabase: any,
  donationId: string,
  tableName: string,
  streamerId: string,
  action: string
): Promise<string> {
  const actionPrefixes: Record<string, string> = {
    'approve': 'a',
    'reject': 'r',
    'hide_message': 'h',
    'ban_donor': 'b',
    'replay': 'p'
  };
  
  const shortId = generateShortId();
  const actionPrefix = actionPrefixes[action] || action.charAt(0);
  
  try {
    const { error } = await supabase
      .from('telegram_callback_mapping')
      .insert({
        short_id: shortId,
        donation_id: donationId,
        table_name: tableName,
        streamer_id: streamerId,
        action_type: action,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
    
    if (error) {
      console.error(`Failed to create callback mapping for ${action}:`, error);
      // Fallback to truncated format (still within 64-byte limit)
      return `${actionPrefix}_${donationId.substring(0, 8)}`;
    }
    
    // Return shortened callback: e.g., "a_Abc12345" (~10 chars, well within 64-byte limit)
    return `${actionPrefix}_${shortId}`;
  } catch (err) {
    console.error(`Exception creating callback mapping:`, err);
    return `${actionPrefix}_${donationId.substring(0, 8)}`;
  }
}

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

    // Active donation tables (all 5 streamers)
    const donationTables = [
      'ankit_donations',
      'chiaa_gaming_donations',
      'looteriya_gaming_donations',
      'clumsy_god_donations',
      'wolfy_donations',
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

        // Currency symbol mapping for clean display
        const currencySymbols: Record<string, string> = {
          'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£', 'AED': 'د.إ', 'AUD': 'A$'
        };
        const currency = donation.currency || 'INR';
        const currencySymbol = currencySymbols[currency] || currency;
        const amountDisplay = `${currencySymbol}${donation.amount} ${currency}`;

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

        // FIX #1: Check actual moderation_status, not moderation_mode
        // This correctly handles media donations that are pending even in auto_approve mode
        const isPending = donation.moderation_status === 'pending';

        // Build message based on actual pending status
        const statusEmoji = isPending ? '⏳' : '✅';
        const statusText = isPending ? 'Pending Approval' : 'Auto-Approved';
        
        // FIX #1 continued: Use isPending alone, not isManualMode && isPending
        let messageText = isPending
          ? `🎁 <b>New Donation - Needs Approval</b> 🎁\n\n`
          : `🎁 <b>New Donation Received!</b> 🎁\n\n`;
        
        messageText += `💰 <b>Amount:</b> ${amountDisplay}\n`;
        messageText += `👤 <b>From:</b> ${donation.name}\n`;
        messageText += `📅 <b>Time:</b> ${new Date(donation.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n`;
        
        if (donation.message) {
          messageText += `💬 <b>Message:</b> ${donation.message.substring(0, 200)}${donation.message.length > 200 ? '...' : ''}\n`;
        }
        
        if (donation.voice_message_url) {
          messageText += `🎵 <b>Voice:</b> Available\n`;
        }
        
        // Indicate if this is a media donation
        if (donation.media_url) {
          const mediaType = donation.media_type || 'media';
          messageText += `📎 <b>Media:</b> ${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} attached\n`;
        }
        
        messageText += `\n${statusEmoji} <i>${statusText}</i>`;

        let notificationSent = false;

        for (const moderator of moderators) {
          try {
            // Build keyboard based on pending status and permissions
            const keyboard: any[][] = [];
            
            // FIX #3: Show approve/reject buttons for ANY pending donation
            // (not just manual mode - includes media moderation)
            if (isPending) {
              // Row 1: Approve/Reject for pending donations
              const row1: any[] = [];
              if (moderator.role === 'owner' || moderator.can_approve) {
                // FIX #2: Use shortened callback mapping
                const approveCallback = await createCallbackMapping(
                  supabaseAdmin, donation.id, donation.source_table, donation.streamer_id, 'approve'
                );
                row1.push({ text: '✅ Approve', callback_data: approveCallback });
              }
              if (moderator.role === 'owner' || moderator.can_reject) {
                const rejectCallback = await createCallbackMapping(
                  supabaseAdmin, donation.id, donation.source_table, donation.streamer_id, 'reject'
                );
                row1.push({ text: '❌ Reject', callback_data: rejectCallback });
              }
              if (row1.length > 0) keyboard.push(row1);

              // Row 2: Hide/Ban
              const row2: any[] = [];
              if ((moderator.role === 'owner' || moderator.can_hide_message) && donation.message) {
                const hideCallback = await createCallbackMapping(
                  supabaseAdmin, donation.id, donation.source_table, donation.streamer_id, 'hide_message'
                );
                row2.push({ text: '🙈 Hide Msg', callback_data: hideCallback });
              }
              if (moderator.role === 'owner' || moderator.can_ban) {
                const banCallback = await createCallbackMapping(
                  supabaseAdmin, donation.id, donation.source_table, donation.streamer_id, 'ban_donor'
                );
                row2.push({ text: '🚫 Ban', callback_data: banCallback });
              }
              if (row2.length > 0) keyboard.push(row2);
            } else {
              // Auto-approved: clean notification with dashboard link only, no action buttons
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

            console.log(`Sending to ${moderator.mod_name} (${moderator.telegram_user_id}), isPending: ${isPending}`);

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
