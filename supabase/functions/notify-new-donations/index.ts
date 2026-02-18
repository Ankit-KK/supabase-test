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

// Create a Discord callback mapping (uses discord_callback_mapping table)
async function createDiscordCallbackMapping(
  supabase: any,
  donationId: string,
  tableName: string,
  streamerId: string,
  action: string
): Promise<string> {
  const shortId = generateShortId();
  try {
    const { error } = await supabase
      .from('discord_callback_mapping')
      .insert({
        short_id: shortId,
        donation_id: donationId,
        table_name: tableName,
        streamer_id: streamerId,
        action_type: action,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
    if (error) {
      console.error(`Failed to create Discord callback mapping for ${action}:`, error);
      return donationId.substring(0, 8);
    }
    return shortId;
  } catch (err) {
    console.error(`Exception creating Discord callback mapping:`, err);
    return donationId.substring(0, 8);
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
      'dorp_plays_donations',
      'zishu_donations',
      'brigzard_donations',
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
        // Get streamer settings (include discord_moderation_enabled)
        const { data: streamer, error: streamerError } = await supabaseAdmin
          .from('streamers')
          .select('id, streamer_slug, streamer_name, moderation_mode, telegram_moderation_enabled, discord_moderation_enabled')
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

        // Skip if both telegram and discord moderation are disabled
        if (!streamer.telegram_moderation_enabled && !streamer.discord_moderation_enabled) {
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
          .select('telegram_user_id, discord_user_id, mod_name, role, can_approve, can_reject, can_hide_message, can_ban')
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

        // === TELEGRAM NOTIFICATIONS ===
        if (streamer.telegram_moderation_enabled) {
          const telegramModerators = moderators.filter((m: any) => m.telegram_user_id);
          
          for (const moderator of telegramModerators) {
            try {
              // Build keyboard based on pending status and permissions
              const keyboard: any[][] = [];
              
              if (isPending) {
                const row1: any[] = [];
                if (moderator.role === 'owner' || moderator.can_approve) {
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
              }

              // Media/Voice preview buttons (URL links, no egress until clicked)
              if (donation.voice_message_url) {
                keyboard.push([{ text: '🎵 Listen Voice', url: donation.voice_message_url }]);
              }
              if (donation.media_url) {
                keyboard.push([{ text: '📎 View Media', url: donation.media_url }]);
              }

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

              console.log(`Sending Telegram to ${moderator.mod_name} (${moderator.telegram_user_id}), isPending: ${isPending}`);

              const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });

              if (resp.ok) {
                console.log(`Telegram sent to ${moderator.mod_name}`);
                notificationSent = true;
              } else {
                const errText = await resp.text();
                console.error(`Telegram failed for ${moderator.mod_name}:`, errText);
              }
            } catch (e) {
              console.error(`Error notifying ${moderator.mod_name} via Telegram:`, e);
            }
          }
        }

        // === DISCORD NOTIFICATIONS ===
        const discordBotToken = Deno.env.get('DISCORD_BOT_TOKEN');
        if (streamer.discord_moderation_enabled && discordBotToken) {
          const discordModerators = moderators.filter((m: any) => m.discord_user_id);
          
          for (const moderator of discordModerators) {
            try {
              // Create DM channel
              const dmChannelResp = await fetch('https://discord.com/api/v10/users/@me/channels', {
                method: 'POST',
                headers: {
                  'Authorization': `Bot ${discordBotToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ recipient_id: moderator.discord_user_id })
              });

              if (!dmChannelResp.ok) {
                console.error(`Failed to create DM channel for ${moderator.mod_name}:`, await dmChannelResp.text());
                continue;
              }

              const dmChannel = await dmChannelResp.json();

              // Build Discord message embed
              const embed: any = {
                title: isPending ? '🎁 New Donation - Needs Approval' : '🎁 New Donation Received!',
                color: isPending ? 0xFFA500 : 0x00FF00,
                fields: [
                  { name: '💰 Amount', value: amountDisplay, inline: true },
                  { name: '👤 From', value: donation.name, inline: true },
                  { name: '📅 Time', value: new Date(donation.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), inline: true }
                ],
                footer: { text: isPending ? '⏳ Pending Approval' : '✅ Auto-Approved' }
              };

              if (donation.message) {
                embed.fields.push({ name: '💬 Message', value: donation.message.substring(0, 200), inline: false });
              }
              if (donation.voice_message_url) {
                embed.fields.push({ name: '🎵 Voice', value: 'Available', inline: true });
              }
              if (donation.media_url) {
                const mediaType = donation.media_type || 'media';
                embed.fields.push({ name: '📎 Media', value: mediaType.charAt(0).toUpperCase() + mediaType.slice(1) + ' attached', inline: true });
              }

              // Build action row buttons for pending donations
              const components: any[] = [];
              if (isPending) {
                const row1Buttons: any[] = [];
                if (moderator.role === 'owner' || moderator.can_approve) {
                  const shortId = await createDiscordCallbackMapping(
                    supabaseAdmin, donation.id, donation.source_table, donation.streamer_id, 'approve'
                  );
                  row1Buttons.push({ type: 2, style: 3, label: '✅ Approve', custom_id: `a_${shortId}` });
                }
                if (moderator.role === 'owner' || moderator.can_reject) {
                  const shortId = await createDiscordCallbackMapping(
                    supabaseAdmin, donation.id, donation.source_table, donation.streamer_id, 'reject'
                  );
                  row1Buttons.push({ type: 2, style: 4, label: '❌ Reject', custom_id: `r_${shortId}` });
                }
                if (row1Buttons.length > 0) {
                  components.push({ type: 1, components: row1Buttons });
                }

                const row2Buttons: any[] = [];
                if ((moderator.role === 'owner' || moderator.can_hide_message) && donation.message) {
                  const shortId = await createDiscordCallbackMapping(
                    supabaseAdmin, donation.id, donation.source_table, donation.streamer_id, 'hide_message'
                  );
                  row2Buttons.push({ type: 2, style: 2, label: '🙈 Hide Msg', custom_id: `h_${shortId}` });
                }
                if (moderator.role === 'owner' || moderator.can_ban) {
                  const shortId = await createDiscordCallbackMapping(
                    supabaseAdmin, donation.id, donation.source_table, donation.streamer_id, 'ban_donor'
                  );
                  row2Buttons.push({ type: 2, style: 4, label: '🚫 Ban', custom_id: `b_${shortId}` });
                }
                if (row2Buttons.length > 0) {
                  components.push({ type: 1, components: row2Buttons });
                }
              }

              // Media/Voice preview buttons (URL links, no egress until clicked)
              if (donation.voice_message_url) {
                components.push({
                  type: 1,
                  components: [{ type: 2, style: 5, label: '🎵 Listen Voice', url: donation.voice_message_url }]
                });
              }
              if (donation.media_url) {
                components.push({
                  type: 1,
                  components: [{ type: 2, style: 5, label: '📎 View Media', url: donation.media_url }]
                });
              }

              // Dashboard link button
              components.push({
                type: 1,
                components: [{
                  type: 2, style: 5, label: '📊 Dashboard',
                  url: `https://hyperchat.site/dashboard/${streamer.streamer_slug}`
                }]
              });

              // Send the DM
              const msgPayload: any = { embeds: [embed] };
              if (components.length > 0) {
                msgPayload.components = components;
              }

              const msgResp = await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bot ${discordBotToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(msgPayload)
              });

              if (msgResp.ok) {
                console.log(`Discord DM sent to ${moderator.mod_name}`);
                notificationSent = true;
              } else {
                console.error(`Discord DM failed for ${moderator.mod_name}:`, await msgResp.text());
              }
            } catch (e) {
              console.error(`Error notifying ${moderator.mod_name} via Discord:`, e);
            }
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
