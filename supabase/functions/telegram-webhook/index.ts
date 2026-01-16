// Production Telegram webhook with full moderation support + callback mapping
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('telegram-webhook: function loaded with callback mapping support');

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

    // Handle callback queries (button presses)
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query, supabaseAdmin, botToken);
    }
    // Handle messages (commands)
    else if (update.message) {
      await handleMessage(update.message, supabaseAdmin, botToken);
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

// Parse callback data - supports both new short format and legacy format
async function parseCallbackData(data: string, supabase: any): Promise<{
  action: string;
  donationId: string;
  tableName: string | null;
  streamerId: string | null;
} | null> {
  // New short format: a_ABC12345 (action prefix + short_id)
  const shortMatch = data.match(/^([arhbp])_([A-Za-z0-9]{8})$/);
  
  if (shortMatch) {
    const actionPrefix = shortMatch[1];
    const shortId = shortMatch[2];
    
    const actionMap: Record<string, string> = {
      'a': 'approve',
      'r': 'reject',
      'h': 'hide_message',
      'b': 'ban_donor',
      'p': 'replay'
    };
    
    // Look up the mapping
    const { data: mapping, error } = await supabase
      .from('telegram_callback_mapping')
      .select('donation_id, table_name, streamer_id, action_type')
      .eq('short_id', shortId)
      .single();
    
    if (error || !mapping) {
      console.error('Callback mapping not found for short_id:', shortId, error);
      return null;
    }
    
    // Check if expired
    const { data: fullMapping } = await supabase
      .from('telegram_callback_mapping')
      .select('expires_at')
      .eq('short_id', shortId)
      .single();
    
    if (fullMapping && new Date(fullMapping.expires_at) < new Date()) {
      console.error('Callback mapping expired for short_id:', shortId);
      return null;
    }
    
    return {
      action: actionMap[actionPrefix] || mapping.action_type,
      donationId: mapping.donation_id,
      tableName: mapping.table_name,
      streamerId: mapping.streamer_id
    };
  }
  
  // Legacy format: action_donationId_tableName
  const parts = data.split('_');
  if (parts.length >= 2) {
    return {
      action: parts[0],
      donationId: parts[1],
      tableName: parts.slice(2).join('_') || null,
      streamerId: null
    };
  }
  
  return null;
}

// Handle callback queries from inline keyboards
async function handleCallbackQuery(callbackQuery: any, supabase: any, botToken: string) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const userId = callbackQuery.from.id.toString();
  const data = callbackQuery.data;
  const userName = callbackQuery.from.first_name || 'Moderator';

  console.log('Callback query:', { chatId, userId, data });

  // Parse callback data (supports both new and legacy formats)
  const parsed = await parseCallbackData(data, supabase);
  
  if (!parsed) {
    await answerCallback(callbackQuery.id, '❌ Invalid or expired action', botToken);
    return;
  }

  const { action, donationId, tableName, streamerId: mappedStreamerId } = parsed;

  // Get moderator info - use streamerId from mapping if available
  let moderator: any = null;
  let modError: any = null;
  
  if (mappedStreamerId) {
    // Use the streamer_id from callback mapping for precise lookup
    const result = await supabase
      .from('streamers_moderators')
      .select('*, streamers(streamer_slug, streamer_name, moderation_mode, telegram_moderation_enabled)')
      .eq('telegram_user_id', userId)
      .eq('streamer_id', mappedStreamerId)
      .eq('is_active', true)
      .single();
    
    moderator = result.data;
    modError = result.error;
  } else {
    // Legacy: Try to find moderator without specific streamer context
    // First get all active moderators for this user
    const { data: moderators, error } = await supabase
      .from('streamers_moderators')
      .select('*, streamers(streamer_slug, streamer_name, moderation_mode, telegram_moderation_enabled)')
      .eq('telegram_user_id', userId)
      .eq('is_active', true);
    
    if (error || !moderators || moderators.length === 0) {
      modError = error || new Error('No moderator found');
    } else if (moderators.length === 1) {
      // Only one streamer - use it
      moderator = moderators[0];
    } else if (tableName) {
      // Multiple streamers - try to match by table name
      moderator = moderators.find((m: any) => {
        const expectedTable = `${m.streamers?.streamer_slug?.replace(/-/g, '_')}_donations`;
        return expectedTable === tableName;
      });
      
      if (!moderator) {
        // Fallback to first one
        moderator = moderators[0];
        console.warn('Could not match moderator to table, using first one');
      }
    } else {
      moderator = moderators[0];
    }
  }

  if (modError || !moderator) {
    console.error('Moderator lookup failed:', modError);
    await answerCallback(callbackQuery.id, '❌ You are not a registered moderator for this streamer', botToken);
    return;
  }

  // Check if telegram moderation is enabled
  if (!moderator.streamers?.telegram_moderation_enabled) {
    await answerCallback(callbackQuery.id, '❌ Telegram moderation is disabled', botToken);
    return;
  }

  // Determine the donation table
  const donationTable = tableName || `${moderator.streamers.streamer_slug.replace(/-/g, '_')}_donations`;

  // Check permission for the action
  if (!hasPermission(moderator, action)) {
    await answerCallback(callbackQuery.id, '❌ No permission for this action', botToken);
    return;
  }

  // Execute moderation action
  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/moderate-donation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        action: action,
        donationId: donationId,
        donationTable: donationTable,
        streamerId: mappedStreamerId || moderator.streamer_id,
        moderatorId: moderator.id,
        moderatorTelegramId: userId,
        moderatorName: moderator.mod_name || userName,
        source: 'telegram'
      })
    });

    const result = await response.json();

    if (result.success) {
      await answerCallback(callbackQuery.id, getActionEmoji(action) + ' ' + getActionText(action), botToken);
      
      // Update the original message
      await editMessageWithResult(chatId, messageId, action, moderator.mod_name, botToken);
    } else {
      await answerCallback(callbackQuery.id, '❌ ' + (result.error || 'Action failed'), botToken);
    }
  } catch (error) {
    console.error('Error executing moderation action:', error);
    await answerCallback(callbackQuery.id, '❌ Error processing action', botToken);
  }
}

async function handleMessage(message: any, supabase: any, botToken: string) {
  const chatId = message.chat.id;
  const text = message.text;
  const userId = message.from.id.toString();

  console.log('Handling message:', { chatId, text, userId });

  if (text === '/start') {
    await sendMessage(chatId, 
      '🎮 <b>HyperChat Moderation Bot</b>\n\n' +
      'Real-time donation moderation & notifications.\n\n' +
      '<b>Commands:</b>\n' +
      '/pending - View pending donations\n' +
      '/recent - View recent donations\n' +
      '/stats - View donation statistics\n' +
      '/status - Check your moderator status\n' +
      '/settings - View moderation settings', 
      botToken
    );
    return;
  }

  if (text === '/pending') {
    await showPendingDonations(chatId, userId, supabase, botToken);
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

  if (text === '/settings') {
    await showSettings(chatId, userId, supabase, botToken);
    return;
  }

  await sendMessage(chatId, 
    '❓ Unknown command.\n\n' +
    '/pending - View pending donations\n' +
    '/recent - View recent donations\n' +
    '/stats - View donation statistics\n' +
    '/status - Check your moderator status\n' +
    '/settings - View moderation settings', 
    botToken
  );
}

// Show pending donations with moderation buttons
async function showPendingDonations(chatId: number, userId: string, supabase: any, botToken: string) {
  // Get all moderator assignments for this user
  const { data: moderators, error: modError } = await supabase
    .from('streamers_moderators')
    .select('*, streamers(streamer_slug, streamer_name, moderation_mode, telegram_moderation_enabled)')
    .eq('telegram_user_id', userId)
    .eq('is_active', true);

  if (modError || !moderators || moderators.length === 0) {
    await sendMessage(chatId, '❌ You are not registered as a moderator.', botToken);
    return;
  }

  // For each streamer the user moderates, show pending donations
  let totalPending = 0;
  
  for (const moderator of moderators) {
    const streamerSlug = moderator.streamers?.streamer_slug;
    const tableName = `${streamerSlug?.replace(/-/g, '_')}_donations`;

    const { data: donations, error: donError } = await supabase
      .from(tableName)
      .select('*')
      .eq('payment_status', 'success')
      .eq('moderation_status', 'pending')
      .order('created_at', { ascending: true })
      .limit(5);

    if (!donError && donations && donations.length > 0) {
      totalPending += donations.length;
      
      await sendMessage(chatId, `📋 <b>${moderator.streamers?.streamer_name} - ${donations.length} Pending</b>`, botToken);
      
      for (const donation of donations) {
        await sendDonationCard(chatId, donation, tableName, moderator, supabase, botToken);
        await new Promise(r => setTimeout(r, 100));
      }
    }
  }
  
  if (totalPending === 0) {
    await sendMessage(chatId, '✅ No pending donations to moderate.', botToken);
  }
}

// Send a single donation card with moderation buttons (using callback mapping)
async function sendDonationCard(chatId: number, donation: any, tableName: string, moderator: any, supabase: any, botToken: string) {
  const time = new Date(donation.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  
  let messageText = `🎁 <b>Donation Pending</b>\n\n`;
  messageText += `💰 <b>Amount:</b> ₹${donation.amount}\n`;
  messageText += `👤 <b>From:</b> ${donation.name}\n`;
  messageText += `⏰ <b>Time:</b> ${time}\n`;
  
  if (donation.message) {
    messageText += `💬 <b>Message:</b> ${donation.message.substring(0, 200)}${donation.message.length > 200 ? '...' : ''}\n`;
  }
  
  if (donation.voice_message_url) {
    messageText += `🎵 <b>Voice:</b> Available\n`;
  }

  // Build keyboard based on permissions using callback mapping
  const keyboard: any[][] = [];
  
  // Row 1: Approve/Reject
  const row1: any[] = [];
  if (hasPermission(moderator, 'approve')) {
    const approveCallback = await createCallbackMapping(supabase, donation.id, tableName, moderator.streamer_id, 'approve');
    row1.push({ text: '✅ Approve', callback_data: approveCallback });
  }
  if (hasPermission(moderator, 'reject')) {
    const rejectCallback = await createCallbackMapping(supabase, donation.id, tableName, moderator.streamer_id, 'reject');
    row1.push({ text: '❌ Reject', callback_data: rejectCallback });
  }
  if (row1.length > 0) keyboard.push(row1);

  // Row 2: Hide/Ban
  const row2: any[] = [];
  if (hasPermission(moderator, 'hide_message') && donation.message) {
    const hideCallback = await createCallbackMapping(supabase, donation.id, tableName, moderator.streamer_id, 'hide_message');
    row2.push({ text: '🙈 Hide Msg', callback_data: hideCallback });
  }
  if (hasPermission(moderator, 'ban_donor')) {
    const banCallback = await createCallbackMapping(supabase, donation.id, tableName, moderator.streamer_id, 'ban_donor');
    row2.push({ text: '🚫 Ban', callback_data: banCallback });
  }
  if (row2.length > 0) keyboard.push(row2);

  await sendMessageWithKeyboard(chatId, messageText, keyboard, botToken);
}

// Generate short ID for callback mapping
function generateShortId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create callback mapping for buttons
async function createCallbackMapping(
  supabase: any,
  donationId: string,
  tableName: string,
  streamerId: string,
  action: string
): Promise<string> {
  const shortId = generateShortId();
  
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
      console.error('Error creating callback mapping:', error);
      return `${action.charAt(0)}_${donationId.substring(0, 8)}`;
    }
    
    const actionPrefix: Record<string, string> = {
      'approve': 'a',
      'reject': 'r',
      'hide_message': 'h',
      'ban_donor': 'b',
      'replay': 'p'
    };
    
    return `${actionPrefix[action] || action.charAt(0)}_${shortId}`;
  } catch (err) {
    console.error('Error in createCallbackMapping:', err);
    return `${action.charAt(0)}_${donationId.substring(0, 8)}`;
  }
}

async function showRecentDonations(chatId: number, userId: string, supabase: any, botToken: string) {
  const { data: moderator, error: modError } = await supabase
    .from('streamers_moderators')
    .select('streamer_id, streamers(streamer_slug, streamer_name)')
    .eq('telegram_user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (modError || !moderator) {
    await sendMessage(chatId, '❌ You are not registered as a moderator.', botToken);
    return;
  }

  const streamerSlug = moderator.streamers?.streamer_slug;
  const tableName = `${streamerSlug?.replace(/-/g, '_')}_donations`;

  const { data: donations, error: donError } = await supabase
    .from(tableName)
    .select('id, name, amount, message, created_at, moderation_status, message_visible')
    .eq('payment_status', 'success')
    .in('moderation_status', ['approved', 'auto_approved'])
    .order('created_at', { ascending: false })
    .limit(5);

  if (donError || !donations || donations.length === 0) {
    await sendMessage(chatId, '📋 No recent donations found.', botToken);
    return;
  }

  let messageText = `📊 <b>Recent Donations - ${moderator.streamers?.streamer_name}</b>\n\n`;
  
  for (const donation of donations) {
    const time = new Date(donation.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const hidden = !donation.message_visible ? ' 🙈' : '';
    messageText += `💰 ₹${donation.amount} from <b>${donation.name}</b>${hidden}\n`;
    if (donation.message && donation.message_visible) {
      messageText += `   💬 "${donation.message.substring(0, 50)}${donation.message.length > 50 ? '...' : ''}"\n`;
    }
    messageText += `   ⏰ ${time}\n\n`;
  }

  await sendMessage(chatId, messageText, botToken);
}

async function showDonationStats(chatId: number, userId: string, supabase: any, botToken: string) {
  const { data: moderator, error: modError } = await supabase
    .from('streamers_moderators')
    .select('streamer_id, total_actions, last_action_at, streamers(streamer_slug, streamer_name)')
    .eq('telegram_user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (modError || !moderator) {
    await sendMessage(chatId, '❌ You are not registered as a moderator.', botToken);
    return;
  }

  const streamerSlug = moderator.streamers?.streamer_slug;
  const tableName = `${streamerSlug?.replace(/-/g, '_')}_donations`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: donations, error: donError } = await supabase
    .from(tableName)
    .select('amount, created_at')
    .eq('payment_status', 'success');

  if (donError || !donations) {
    await sendMessage(chatId, '❌ Failed to fetch statistics.', botToken);
    return;
  }

  const totalRevenue = donations.reduce((sum: number, d: any) => sum + Number(d.amount), 0);
  const todayDonations = donations.filter((d: any) => new Date(d.created_at) >= today);
  const todayRevenue = todayDonations.reduce((sum: number, d: any) => sum + Number(d.amount), 0);

  // Get pending count
  const { count: pendingCount } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true })
    .eq('payment_status', 'success')
    .eq('moderation_status', 'pending');

  const messageText = 
    `📊 <b>Stats - ${moderator.streamers?.streamer_name}</b>\n\n` +
    `💰 Total Revenue: ₹${totalRevenue.toFixed(2)}\n` +
    `📈 Total Donations: ${donations.length}\n` +
    `📅 Today's Revenue: ₹${todayRevenue.toFixed(2)}\n` +
    `🎯 Today's Donations: ${todayDonations.length}\n` +
    `💵 Average: ₹${donations.length > 0 ? (totalRevenue / donations.length).toFixed(2) : 0}\n\n` +
    `⏳ Pending: ${pendingCount || 0}\n` +
    `🛡️ Your Actions: ${moderator.total_actions || 0}`;

  await sendMessage(chatId, messageText, botToken);
}

async function showModeratorStatus(chatId: number, userId: string, supabase: any, botToken: string) {
  // Get all moderator assignments for this user
  const { data: moderators, error } = await supabase
    .from('streamers_moderators')
    .select('*, streamers(streamer_name, streamer_slug, moderation_mode, telegram_moderation_enabled)')
    .eq('telegram_user_id', userId);

  if (error || !moderators || moderators.length === 0) {
    await sendMessage(chatId, 
      '❌ You are not registered as a moderator.\n\n' +
      'Contact the streamer to add you.', 
      botToken
    );
    return;
  }

  let messageText = `👤 <b>Moderator Status</b>\n\n`;
  
  for (const moderator of moderators) {
    const status = moderator.is_active ? '✅ Active' : '❌ Inactive';
    const since = new Date(moderator.created_at).toLocaleDateString('en-IN');
    const role = moderator.role || 'moderator';

    const permissions: string[] = [];
    if (moderator.role === 'owner') {
      permissions.push('All permissions');
    } else if (moderator.role === 'viewer') {
      permissions.push('View only');
    } else {
      if (moderator.can_approve) permissions.push('Approve');
      if (moderator.can_reject) permissions.push('Reject');
      if (moderator.can_hide_message) permissions.push('Hide');
      if (moderator.can_ban) permissions.push('Ban');
      if (moderator.can_replay) permissions.push('Replay');
    }

    messageText += 
      `🎮 <b>${moderator.streamers?.streamer_name}</b>\n` +
      `   📊 Status: ${status}\n` +
      `   👑 Role: ${role.charAt(0).toUpperCase() + role.slice(1)}\n` +
      `   🔐 Permissions: ${permissions.join(', ')}\n` +
      `   📅 Since: ${since}\n` +
      `   🛡️ Actions: ${moderator.total_actions || 0}\n\n`;
  }

  await sendMessage(chatId, messageText, botToken);
}

async function showSettings(chatId: number, userId: string, supabase: any, botToken: string) {
  const { data: moderator, error } = await supabase
    .from('streamers_moderators')
    .select('*, streamers(streamer_name, moderation_mode, telegram_moderation_enabled)')
    .eq('telegram_user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (error || !moderator) {
    await sendMessage(chatId, '❌ You are not registered as a moderator.', botToken);
    return;
  }

  const mode = moderator.streamers?.moderation_mode || 'auto_approve';
  const telegramEnabled = moderator.streamers?.telegram_moderation_enabled;

  const messageText = 
    `⚙️ <b>Moderation Settings</b>\n\n` +
    `🎮 Streamer: <b>${moderator.streamers?.streamer_name}</b>\n\n` +
    `📋 <b>Mode:</b> ${mode === 'manual' ? 'Manual Approval' : 'Auto-Approve'}\n` +
    `📱 <b>Telegram:</b> ${telegramEnabled ? 'Enabled ✅' : 'Disabled ❌'}\n\n` +
    `${mode === 'manual' 
      ? '⚠️ Donations require manual approval before showing on stream.' 
      : '✅ Donations are auto-approved and show on stream immediately.'}`;

  await sendMessage(chatId, messageText, botToken);
}

// Helper functions
function hasPermission(moderator: any, action: string): boolean {
  if (moderator.role === 'owner') return true;
  if (moderator.role === 'viewer') return false;
  
  switch (action) {
    case 'approve': return moderator.can_approve;
    case 'reject': return moderator.can_reject;
    case 'hide_message': return moderator.can_hide_message;
    case 'ban_donor': return moderator.can_ban;
    case 'replay': return moderator.can_replay;
    default: return false;
  }
}

function getActionEmoji(action: string): string {
  const emojis: Record<string, string> = {
    approve: '✅',
    reject: '❌',
    hide_message: '🙈',
    unhide_message: '👁️',
    ban_donor: '🚫',
    replay: '🔄'
  };
  return emojis[action] || '✓';
}

function getActionText(action: string): string {
  const texts: Record<string, string> = {
    approve: 'Approved',
    reject: 'Rejected',
    hide_message: 'Message hidden',
    unhide_message: 'Message visible',
    ban_donor: 'Donor banned',
    replay: 'Replaying alert'
  };
  return texts[action] || 'Done';
}

async function answerCallback(callbackQueryId: string, text: string, botToken: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text: text,
      show_alert: false
    })
  });
}

async function editMessageWithResult(chatId: number, messageId: number, action: string, moderatorName: string, botToken: string) {
  const emoji = getActionEmoji(action);
  const actionText = getActionText(action);
  
  await fetch(`https://api.telegram.org/bot${botToken}/editMessageReplyMarkup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: [] }
    })
  });

  // Add result text to original message
  await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text: `${emoji} <b>${actionText}</b> by ${moderatorName}`,
      parse_mode: 'HTML'
    })
  });
}

async function sendMessage(chatId: number, text: string, botToken: string, parseMode: string = 'HTML') {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: parseMode
      })
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

async function sendMessageWithKeyboard(chatId: number, text: string, keyboard: any[][], botToken: string) {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboard }
      })
    });
  } catch (error) {
    console.error('Error sending message with keyboard:', error);
  }
}
