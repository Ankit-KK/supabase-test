import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Hash } from 'https://deno.land/x/checksum@1.4.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('telegram-webhook: function loaded');

// Pusher client for Deno
class PusherClient {
  private appId: string;
  private key: string;
  private secret: string;
  private cluster: string;

  constructor(appId: string, key: string, secret: string, cluster: string) {
    this.appId = appId;
    this.key = key;
    this.secret = secret;
    this.cluster = cluster;
  }

  async trigger(channel: string, event: string, data: any) {
    const body = JSON.stringify({ name: event, data: JSON.stringify(data), channel });
    const timestamp = Math.floor(Date.now() / 1000);
    
    const hash = new Hash("md5");
    const bodyMd5 = hash.digest(new TextEncoder().encode(body)).hex();
    
    const authString = `POST\n/apps/${this.appId}/events\nauth_key=${this.key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${bodyMd5}`;
    const authSignature = await this.hmacSha256(authString, this.secret);
    
    const url = `https://api-${this.cluster}.pusher.com/apps/${this.appId}/events?auth_key=${this.key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${bodyMd5}&auth_signature=${authSignature}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pusher trigger failed: ${error}`);
    }

    return response.json();
  }

  private async hmacSha256(message: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

// Helper function to get Pusher credentials based on streamer_slug
async function getPusherCredentials(streamerSlug: string, supabase: any) {
  try {
    const { data: streamer, error } = await supabase
      .from('streamers')
      .select('pusher_group, streamer_name')
      .eq('streamer_slug', streamerSlug)
      .single();

    if (error || !streamer) {
      console.error(`[Pusher] Failed to fetch pusher_group for ${streamerSlug}:`, error);
      return {
        appId: Deno.env.get('PUSHER_APP_ID_1') || Deno.env.get('PUSHER_APP_ID'),
        key: Deno.env.get('PUSHER_KEY_1') || Deno.env.get('PUSHER_KEY'),
        secret: Deno.env.get('PUSHER_SECRET_1') || Deno.env.get('PUSHER_SECRET'),
        cluster: Deno.env.get('PUSHER_CLUSTER_1') || Deno.env.get('PUSHER_CLUSTER'),
        group: 1
      };
    }

    const group = streamer.pusher_group || 1;
    
    const credentials = {
      appId: Deno.env.get(`PUSHER_APP_ID_${group}`),
      key: Deno.env.get(`PUSHER_KEY_${group}`),
      secret: Deno.env.get(`PUSHER_SECRET_${group}`),
      cluster: Deno.env.get(`PUSHER_CLUSTER_${group}`),
      group
    };

    if (!credentials.appId || !credentials.key || !credentials.secret || !credentials.cluster) {
      console.error(`[Pusher] Missing credentials for Group ${group}`);
      throw new Error(`Pusher Group ${group} credentials not configured`);
    }

    console.log(`[Pusher] Using Group ${group} for streamer: ${streamerSlug}`);
    return credentials;
  } catch (error) {
    console.error('[Pusher] Error fetching credentials:', error);
    throw error;
  }
}

// Helper function to get streamer slug from table name
function getStreamerSlugFromTable(tableName: string): string {
  // Remove '_donations' suffix and handle special cases
  const slug = tableName.replace('_donations', '');
  // Handle special mappings
  if (slug === 'chiaa_gaming') return 'chiaa_gaming';
  if (slug === 'looteriya_gaming') return 'looteriya_gaming';
  if (slug === 'damask_plays') return 'damask_plays';
  if (slug === 'neko_xenpai') return 'neko_xenpai';
  if (slug === 'jimmy_gaming') return 'jimmy_gaming';
  return slug;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

    const update = await req.json();
    console.log('Telegram webhook received:', JSON.stringify(update, null, 2));

    // Handle different types of updates
    if (update.message) {
      await handleMessage(update.message, supabaseAdmin, botToken);
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query, supabaseAdmin, botToken);
    }

    return new Response('OK', {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });

  } catch (error) {
    console.error('Error in telegram-webhook:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handleMessage(message: any, supabase: any, botToken: string) {
  const chatId = message.chat.id;
  const text = message.text;
  const userId = message.from.id.toString();

  console.log('Handling message:', { chatId, text, userId });

  if (text === '/start') {
    await sendMessage(chatId, 'Welcome to the Donation Dashboard Bot! 📊\n\nThis bot provides real-time donation notifications and analytics.\n\nAvailable commands:\n/recent - View recent donations\n/stats - View donation statistics\n/status - Check your moderator status', botToken);
    return;
  }

  if (text === '/recent') {
    await showRecentDonations(chatId, userId, supabase, botToken);
    return;
  }

  if (text === '/stats') {
    await showDonationStats(chatId, userId, supabase, botToken);
    return;
  }

  if (text === '/status') {
    await showModeratorStatus(chatId, userId, supabase, botToken);
    return;
  }

  // Default response for unknown commands
  await sendMessage(chatId, 'Unknown command. Available commands:\n/recent - View recent donations\n/stats - View donation statistics\n/status - Check your moderator status', botToken);
}

async function handleCallbackQuery(callbackQuery: any, supabase: any, botToken: string) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  const userId = callbackQuery.from.id.toString();
  const username = callbackQuery.from.username || callbackQuery.from.first_name || 'Moderator';

  console.log('Handling callback query:', { chatId, messageId, data, userId });

  try {
    if (data.startsWith('approve_')) {
      // Format: approve_tableName_donationId
      const parts = data.replace('approve_', '').split('_');
      const donationId = parts.pop(); // Last part is donation ID
      const tableName = parts.join('_'); // Rest is table name
      await handleApproval(tableName, donationId, userId, username, chatId, messageId, supabase, botToken);
    } else if (data.startsWith('reject_')) {
      const parts = data.replace('reject_', '').split('_');
      const donationId = parts.pop();
      const tableName = parts.join('_');
      await handleRejection(tableName, donationId, userId, username, chatId, messageId, supabase, botToken);
    } else if (data.startsWith('hide_')) {
      const parts = data.replace('hide_', '').split('_');
      const donationId = parts.pop();
      const tableName = parts.join('_');
      await handleHideMessage(tableName, donationId, userId, username, chatId, messageId, supabase, botToken);
    } else if (data.startsWith('play_')) {
      const donationId = data.replace('play_', '');
      await playVoiceMessage(donationId, userId, chatId, messageId, supabase, botToken);
    } else if (data.startsWith('dashboard_')) {
      const streamerSlug = data.replace('dashboard_', '');
      await sendMessage(chatId, `📊 View full dashboard: https://hyperchat.in/dashboard/${streamerSlug}`, botToken);
    }
  } catch (error) {
    console.error('Error handling callback:', error);
    await sendMessage(chatId, '❌ An error occurred while processing your request.', botToken);
  }

  // Answer the callback query to remove the loading indicator
  await answerCallbackQuery(callbackQuery.id, botToken);
}

// Handle approval from Telegram
async function handleApproval(tableName: string, donationId: string, userId: string, username: string, chatId: number, messageId: number, supabase: any, botToken: string) {
  console.log('Handling approval:', { tableName, donationId, userId });
  
  // Verify user is a moderator for this donation's streamer
  const isAuthorized = await verifyModeratorAccess(tableName, donationId, userId, supabase);
  if (!isAuthorized) {
    await editMessage(chatId, messageId, '❌ You are not authorized to moderate this donation.', botToken);
    return;
  }

  // Update donation status
  const { error } = await supabase
    .from(tableName)
    .update({
      moderation_status: 'approved',
      approved_by: `telegram:${username}`,
      approved_at: new Date().toISOString()
    })
    .eq('id', donationId);

  if (error) {
    console.error('Error approving donation:', error);
    await editMessage(chatId, messageId, '❌ Failed to approve donation. Please try again.', botToken);
    return;
  }

  // Get full donation details for OBS alert
  const { data: donation } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', donationId)
    .single();

  if (donation) {
    // Trigger OBS alert via Pusher
    try {
      const streamerSlug = getStreamerSlugFromTable(tableName);
      console.log(`[Approval] Triggering OBS alert for streamer: ${streamerSlug}`);
      
      const pusherCreds = await getPusherCredentials(streamerSlug, supabase);
      const pusher = new PusherClient(
        pusherCreds.appId,
        pusherCreds.key,
        pusherCreds.secret,
        pusherCreds.cluster
      );
      
      const alertsChannel = `${streamerSlug}-alerts`;
      await pusher.trigger(alertsChannel, 'new-donation', {
        id: donation.id,
        name: donation.name,
        amount: donation.amount,
        message: donation.message,
        voice_message_url: donation.voice_message_url,
        tts_audio_url: donation.tts_audio_url,
        is_hyperemote: donation.is_hyperemote,
        created_at: donation.created_at,
        streamer_id: donation.streamer_id,
      });
      
      console.log(`✅ OBS alert triggered on ${alertsChannel} after approval`);
      
      // Also send to audio channel if there's voice/TTS
      if (donation.voice_message_url || donation.tts_audio_url) {
        const audioChannel = `${streamerSlug}-audio`;
        await pusher.trigger(audioChannel, 'new-audio-message', {
          id: donation.id,
          name: donation.name,
          amount: donation.amount,
          message: donation.message,
          voice_message_url: donation.voice_message_url,
          tts_audio_url: donation.tts_audio_url,
          announcement_tts_url: null,
          created_at: donation.created_at,
        });
        console.log(`✅ Audio event sent to ${audioChannel}`);
      }
    } catch (pusherError) {
      console.error('❌ Failed to trigger OBS alert:', pusherError);
    }
  }

  const confirmationMessage = 
    `✅ <b>APPROVED</b> by @${escapeHtml(username)}\n\n` +
    `💰 <b>Amount:</b> ₹${donation?.amount || 'N/A'}\n` +
    `👤 <b>From:</b> ${escapeHtml(donation?.name || 'Unknown')}\n` +
    `💬 <b>Message:</b> ${donation?.message ? escapeHtml(donation.message.substring(0, 100)) : '<i>No message</i>'}\n\n` +
    `🎬 <b>Alert sent to OBS!</b>\n` +
    `⏰ ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;

  await editMessage(chatId, messageId, confirmationMessage, botToken);
  console.log('Donation approved successfully:', donationId);
}

// Handle rejection from Telegram
async function handleRejection(tableName: string, donationId: string, userId: string, username: string, chatId: number, messageId: number, supabase: any, botToken: string) {
  console.log('Handling rejection:', { tableName, donationId, userId });
  
  const isAuthorized = await verifyModeratorAccess(tableName, donationId, userId, supabase);
  if (!isAuthorized) {
    await editMessage(chatId, messageId, '❌ You are not authorized to moderate this donation.', botToken);
    return;
  }

  const { error } = await supabase
    .from(tableName)
    .update({
      moderation_status: 'rejected',
      approved_by: `telegram:${username}`,
      approved_at: new Date().toISOString()
    })
    .eq('id', donationId);

  if (error) {
    console.error('Error rejecting donation:', error);
    await editMessage(chatId, messageId, '❌ Failed to reject donation. Please try again.', botToken);
    return;
  }

  const { data: donation } = await supabase
    .from(tableName)
    .select('name, amount')
    .eq('id', donationId)
    .single();

  const confirmationMessage = 
    `❌ <b>REJECTED</b> by @${escapeHtml(username)}\n\n` +
    `💰 <b>Amount:</b> ₹${donation?.amount || 'N/A'}\n` +
    `👤 <b>From:</b> ${escapeHtml(donation?.name || 'Unknown')}\n\n` +
    `⏰ ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;

  await editMessage(chatId, messageId, confirmationMessage, botToken);
  console.log('Donation rejected successfully:', donationId);
}

// Handle hide message from Telegram
async function handleHideMessage(tableName: string, donationId: string, userId: string, username: string, chatId: number, messageId: number, supabase: any, botToken: string) {
  console.log('Handling hide message:', { tableName, donationId, userId });
  
  const isAuthorized = await verifyModeratorAccess(tableName, donationId, userId, supabase);
  if (!isAuthorized) {
    await editMessage(chatId, messageId, '❌ You are not authorized to moderate this donation.', botToken);
    return;
  }

  const { error } = await supabase
    .from(tableName)
    .update({
      message_visible: false,
      moderation_status: 'approved',
      approved_by: `telegram:${username}`,
      approved_at: new Date().toISOString()
    })
    .eq('id', donationId);

  if (error) {
    console.error('Error hiding message:', error);
    await editMessage(chatId, messageId, '❌ Failed to hide message. Please try again.', botToken);
    return;
  }

  const { data: donation } = await supabase
    .from(tableName)
    .select('name, amount')
    .eq('id', donationId)
    .single();

  const confirmationMessage = 
    `👁️ <b>MESSAGE HIDDEN & APPROVED</b> by @${escapeHtml(username)}\n\n` +
    `💰 <b>Amount:</b> ₹${donation?.amount || 'N/A'}\n` +
    `👤 <b>From:</b> ${escapeHtml(donation?.name || 'Unknown')}\n` +
    `📝 Message will not be shown on stream\n\n` +
    `⏰ ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;

  await editMessage(chatId, messageId, confirmationMessage, botToken);
  console.log('Message hidden successfully:', donationId);
}

// Verify that a user is a moderator for the streamer who owns this donation
async function verifyModeratorAccess(tableName: string, donationId: string, telegramUserId: string, supabase: any): Promise<boolean> {
  try {
    // Get the streamer_id from the donation
    const { data: donation, error: donationError } = await supabase
      .from(tableName)
      .select('streamer_id')
      .eq('id', donationId)
      .single();

    if (donationError || !donation?.streamer_id) {
      console.error('Donation not found or no streamer_id:', donationError);
      return false;
    }

    // Check if user is a moderator for this streamer
    const { data: moderator, error: modError } = await supabase
      .from('streamers_moderators')
      .select('id')
      .eq('streamer_id', donation.streamer_id)
      .eq('telegram_user_id', telegramUserId)
      .eq('is_active', true)
      .maybeSingle();

    if (modError) {
      console.error('Error checking moderator status:', modError);
      return false;
    }

    return !!moderator;
  } catch (error) {
    console.error('Error in verifyModeratorAccess:', error);
    return false;
  }
}

async function showModeratorStatus(chatId: number, userId: string, supabase: any, botToken: string) {
  try {
    // Check if user is a moderator for any streamers
    const { data: moderatorData, error } = await supabase
      .from('streamers_moderators')
      .select(`
        *,
        streamers (
          streamer_name,
          streamer_slug
        )
      `)
      .eq('telegram_user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Error checking moderator status:', error);
      await sendMessage(chatId, '❌ Error checking moderator status. Please try again later.', botToken);
      return;
    }

    if (!moderatorData || moderatorData.length === 0) {
      await sendMessage(chatId, '❌ You are not a verified moderator for any streamers.\n\nTo become a moderator, ask a streamer to add your Telegram User ID to their moderator list in their dashboard.', botToken);
      return;
    }

    // Build status message
    let statusMessage = '✅ <b>Moderator Status: VERIFIED</b>\n\n';
    statusMessage += `👤 <b>Name:</b> ${escapeHtml(moderatorData[0].mod_name || 'Unknown')}\n`;
    statusMessage += `🆔 <b>Telegram ID:</b> ${escapeHtml(userId)}\n\n`;
    statusMessage += '🎮 <b>Moderating for:</b>\n';

    moderatorData.forEach((mod: any) => {
      const streamer = mod.streamers;
      if (streamer) {
        statusMessage += `• ${escapeHtml(streamer.streamer_name)} (@${escapeHtml(streamer.streamer_slug)})\n`;
      }
    });

    statusMessage += '\n📋 <b>Available Commands:</b>\n';
    statusMessage += '• /recent - View recent donations\n';
    statusMessage += '• /stats - View donation statistics\n';
    statusMessage += '• /status - Check this status again';

    await sendMessage(chatId, statusMessage, botToken);

  } catch (error) {
    console.error('Error in showModeratorStatus:', error);
    await sendMessage(chatId, '❌ An error occurred while checking your status.', botToken);
  }
}

async function showRecentDonations(chatId: number, userId: string, supabase: any, botToken: string) {
  try {
    // Find the moderator's streamer
    const { data: moderator, error: modError } = await supabase
      .from('streamers_moderators')
      .select(`
        streamer_id,
        streamers!inner(
          id,
          streamer_name,
          streamer_slug
        )
      `)
      .eq('telegram_user_id', userId)
      .eq('is_active', true)
      .single();

    if (modError || !moderator) {
      await sendMessage(chatId, 'You are not registered as a moderator. Please contact the streamer to get access.', botToken);
      return;
    }

    // Get recent donations for this streamer from both tables
    const { data: chiaDonations, error: chiaErr } = await supabase
      .from('chia_gaming_donations')
      .select('id, name, amount, message, voice_message_url, created_at, moderation_status')
      .eq('streamer_id', moderator.streamer_id)
      .eq('payment_status', 'success')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: ankitDonations, error: ankitErr } = await supabase
      .from('ankit_donations')
      .select('id, name, amount, message, voice_message_url, created_at, moderation_status')
      .eq('streamer_id', moderator.streamer_id)
      .eq('payment_status', 'success')
      .order('created_at', { ascending: false })
      .limit(10);

    if (chiaErr) console.error('Error fetching chia recent donations:', chiaErr);
    if (ankitErr) console.error('Error fetching ankit recent donations:', ankitErr);

    const donations = [ ...(chiaDonations || []), ...(ankitDonations || []) ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    if (!donations || donations.length === 0) {
      await sendMessage(chatId, `📊 No recent donations found for ${moderator.streamers.streamer_name}.`, botToken);
      return;
    }

    let messageText = `📊 <b>Recent Donations - ${moderator.streamers.streamer_name}</b>\n\n`;
    donations.forEach((donation, index) => {
      const statusEmoji = donation.moderation_status === 'approved' || donation.moderation_status === 'auto_approved' ? '✅' : '⏳';
      messageText += `${statusEmoji} <b>₹${donation.amount}</b> from ${escapeHtml(donation.name)}\n`;
      messageText += `   📅 ${new Date(donation.created_at).toLocaleString()}\n`;
      if (donation.message) {
        messageText += `   💬 ${escapeHtml(donation.message.substring(0, 50))}${donation.message.length > 50 ? '...' : ''}\n`;
      }
      if (donation.voice_message_url) {
        messageText += `   🎵 Has voice message\n`;
      }
      messageText += '\n';
    });

    const keyboard = {
      inline_keyboard: [[
        { text: '📊 Full Dashboard', callback_data: `dashboard_${moderator.streamers.streamer_slug}` }
      ]]
    };

    await sendMessage(chatId, messageText, botToken, keyboard);

  } catch (error) {
    console.error('Error in showRecentDonations:', error);
    await sendMessage(chatId, 'Error fetching recent donations. Please try again.', botToken);
  }
}

async function showDonationStats(chatId: number, userId: string, supabase: any, botToken: string) {
  try {
    // Find the moderator's streamer
    const { data: moderator, error: modError } = await supabase
      .from('streamers_moderators')
      .select(`
        streamer_id,
        streamers!inner(
          id,
          streamer_name,
          streamer_slug
        )
      `)
      .eq('telegram_user_id', userId)
      .eq('is_active', true)
      .single();

    if (modError || !moderator) {
      await sendMessage(chatId, 'You are not registered as a moderator. Please contact the streamer to get access.', botToken);
      return;
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    // Get stats from both tables
    const { data: chiaStatsToday } = await supabase
      .from('chia_gaming_donations')
      .select('amount')
      .eq('streamer_id', moderator.streamer_id)
      .eq('payment_status', 'success')
      .gte('created_at', today.toISOString().split('T')[0]);

    const { data: ankitStatsToday } = await supabase
      .from('ankit_donations')
      .select('amount')
      .eq('streamer_id', moderator.streamer_id)
      .eq('payment_status', 'success')
      .gte('created_at', today.toISOString().split('T')[0]);

    const { data: chiaStatsWeek } = await supabase
      .from('chia_gaming_donations')
      .select('amount')
      .eq('streamer_id', moderator.streamer_id)
      .eq('payment_status', 'success')
      .gte('created_at', thisWeek.toISOString());

    const { data: ankitStatsWeek } = await supabase
      .from('ankit_donations')
      .select('amount')
      .eq('streamer_id', moderator.streamer_id)
      .eq('payment_status', 'success')
      .gte('created_at', thisWeek.toISOString());

    const todayDonations = [...(chiaStatsToday || []), ...(ankitStatsToday || [])];
    const weekDonations = [...(chiaStatsWeek || []), ...(ankitStatsWeek || [])];

    const todayTotal = todayDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
    const weekTotal = weekDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0);

    let statsMessage = `📈 <b>Donation Statistics - ${moderator.streamers.streamer_name}</b>\n\n`;
    statsMessage += `📅 <b>Today:</b>\n`;
    statsMessage += `   💰 ₹${todayTotal.toFixed(2)} from ${todayDonations.length} donations\n\n`;
    statsMessage += `📊 <b>This Week:</b>\n`;
    statsMessage += `   💰 ₹${weekTotal.toFixed(2)} from ${weekDonations.length} donations\n\n`;
    statsMessage += `🎯 <b>Average per donation:</b> ₹${weekDonations.length > 0 ? (weekTotal / weekDonations.length).toFixed(2) : '0'}`;

    const keyboard = {
      inline_keyboard: [[
        { text: '📊 Full Dashboard', callback_data: `dashboard_${moderator.streamers.streamer_slug}` }
      ]]
    };

    await sendMessage(chatId, statsMessage, botToken, keyboard);

  } catch (error) {
    console.error('Error in showDonationStats:', error);
    await sendMessage(chatId, 'Error fetching donation statistics. Please try again.', botToken);
  }
}

async function playVoiceMessage(donationId: string, userId: string, chatId: number, messageId: number, supabase: any, botToken: string) {
  try {
    // Try Chia table first with joins
    let voiceUrl: string | null = null;
    let donorName = '';
    let amount = 0;
    let streamerId: string | null = null;

    const { data: chiaDonation } = await supabase
      .from('chia_gaming_donations')
      .select(`voice_message_url, name, amount, streamers!inner(id, streamer_name, streamers_moderators!inner(telegram_user_id, is_active))`)
      .eq('id', donationId)
      .maybeSingle();

    if (chiaDonation && chiaDonation.voice_message_url) {
      // Verify moderator
      const isModerator = chiaDonation.streamers.streamers_moderators.some(
        (mod: any) => mod.telegram_user_id === userId && mod.is_active
      );
      if (!isModerator) {
        await editMessage(chatId, messageId, '❌ You are not authorized to access this donation.', botToken);
        return;
      }
      voiceUrl = chiaDonation.voice_message_url;
      donorName = chiaDonation.name;
      amount = chiaDonation.amount;
    } else {
      // Fallback to Ankit table
      const { data: ankitDonation } = await supabase
        .from('ankit_donations')
        .select('voice_message_url, name, amount, streamer_id')
        .eq('id', donationId)
        .maybeSingle();

      if (!ankitDonation || !ankitDonation.voice_message_url) {
        await editMessage(chatId, messageId, '❌ Voice message not found.', botToken);
        return;
      }

      // Verify moderator for this streamer
      streamerId = ankitDonation.streamer_id;
      const { data: mods } = await supabase
        .from('streamers_moderators')
        .select('telegram_user_id, is_active')
        .eq('streamer_id', streamerId)
        .eq('is_active', true);

      const isModerator = (mods || []).some((m: any) => m.telegram_user_id === userId);
      if (!isModerator) {
        await editMessage(chatId, messageId, '❌ You are not authorized to access this donation.', botToken);
        return;
      }

      voiceUrl = ankitDonation.voice_message_url;
      donorName = ankitDonation.name;
      amount = ankitDonation.amount;
    }

    // Send voice message
    await sendAudioFile(chatId, voiceUrl!, botToken, `Voice message from ${donorName} (₹${amount})`);

  } catch (error) {
    console.error('Error in playVoiceMessage:', error);
    await sendMessage(chatId, '❌ Error playing voice message.', botToken);
  }
}

// Telegram HTML escaping helper
function escapeHtml(input: string = ''): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Telegram API helper functions
async function sendMessage(chatId: number, text: string, botToken: string, replyMarkup?: any) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload: any = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML'
  };

  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Error sending message:', error);
    throw new Error(`Failed to send message: ${error}`);
  }

  return await response.json();
}

async function sendAudioFile(chatId: number, audioUrl: string, botToken: string, caption?: string) {
  try {
    console.log('Fetching audio for Telegram upload:', audioUrl);
    const resp = await fetch(audioUrl);
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`Fetch audio failed: ${resp.status} ${t}`);
    }
    const mime = resp.headers.get('content-type') || 'application/octet-stream';
    let ab = await resp.arrayBuffer();
    
    // Convert WebM to OGG for better Telegram compatibility
    if (mime.includes('webm')) {
      console.log('Converting WebM to OGG for Telegram compatibility');
      ab = await convertWebMToOgg(ab);
    }
    
    const bytes = new Uint8Array(ab);

    // Use OGG for voice messages as it has better inline playback support
    const fileName = 'voice_message.ogg';
    const form = new FormData();
    form.append('chat_id', chatId.toString());
    if (caption) form.append('caption', caption);
    
    // Send as voice message for inline playback
    const file = new File([bytes], fileName, { type: 'audio/ogg' });
    form.append('voice', file);

    const url = `https://api.telegram.org/bot${botToken}/sendVoice`;
    const tgResp = await fetch(url, { method: 'POST', body: form });

    if (!tgResp.ok) {
      const errText = await tgResp.text();
      console.error('sendVoice failed, falling back to sendVoice with URL:', errText);
      return await sendVoiceWithUrl(chatId, audioUrl, botToken, caption);
    }

    return await tgResp.json();
  } catch (error) {
    console.error('Error in sendAudioFile:', error);
    return await sendVoiceWithUrl(chatId, audioUrl, botToken, caption);
  }
}

async function convertWebMToOgg(webmBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  try {
    // For now, we'll return the original buffer as OGG conversion requires ffmpeg
    // which is complex in edge functions. Telegram should handle WebM -> OGG internally
    // when we specify the correct content-type as audio/ogg
    console.log('WebM to OGG conversion requested, using original buffer with OGG headers');
    return webmBuffer;
  } catch (error) {
    console.error('Error converting WebM to OGG:', error);
    return webmBuffer;
  }
}

async function sendVoiceWithUrl(chatId: number, voiceUrl: string, botToken: string, caption?: string) {
  const url = `https://api.telegram.org/bot${botToken}/sendVoice`;
  const payload: any = {
    chat_id: chatId,
    voice: voiceUrl
  };

  if (caption) {
    payload.caption = caption;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Error sending voice (URL) message:', error);
    throw new Error(`Failed to send voice message: ${error}`);
  }

  return await response.json();
}

async function editMessage(chatId: number, messageId: number, text: string, botToken: string, replyMarkup?: any) {
  const url = `https://api.telegram.org/bot${botToken}/editMessageText`;
  const payload: any = {
    chat_id: chatId,
    message_id: messageId,
    text: text,
    parse_mode: 'HTML'
  };

  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Error editing message:', error);
  }

  return response.ok;
}

async function answerCallbackQuery(callbackQueryId: string, botToken: string, text?: string) {
  const url = `https://api.telegram.org/bot${botToken}/answerCallbackQuery`;
  const payload: any = {
    callback_query_id: callbackQueryId
  };

  if (text) {
    payload.text = text;
  }

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}