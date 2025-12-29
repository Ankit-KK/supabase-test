// Updated: 2025-12-29 - Removed moderation system, kept notification commands only
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('telegram-webhook: function loaded');

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

    // Handle messages only (no callback queries for moderation)
    if (update.message) {
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

async function handleMessage(message: any, supabase: any, botToken: string) {
  const chatId = message.chat.id;
  const text = message.text;
  const userId = message.from.id.toString();

  console.log('Handling message:', { chatId, text, userId });

  if (text === '/start') {
    await sendMessage(chatId, 
      'Welcome to the Donation Dashboard Bot! 📊\n\n' +
      'This bot provides real-time donation notifications.\n\n' +
      'Available commands:\n' +
      '/recent - View recent donations\n' +
      '/stats - View donation statistics\n' +
      '/status - Check your moderator status', 
      botToken
    );
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
  await sendMessage(chatId, 
    'Unknown command. Available commands:\n' +
    '/recent - View recent donations\n' +
    '/stats - View donation statistics\n' +
    '/status - Check your moderator status', 
    botToken
  );
}

// Show recent donations
async function showRecentDonations(chatId: number, userId: string, supabase: any, botToken: string) {
  // Get moderator's streamer
  const { data: moderator, error: modError } = await supabase
    .from('streamers_moderators')
    .select('streamer_id, streamers(streamer_slug, streamer_name)')
    .eq('telegram_user_id', userId)
    .eq('is_active', true)
    .single();

  if (modError || !moderator) {
    await sendMessage(chatId, '❌ You are not registered as a moderator for any streamer.', botToken);
    return;
  }

  const streamerSlug = moderator.streamers?.streamer_slug;
  const tableName = `${streamerSlug?.replace(/-/g, '_')}_donations`;

  // Fetch recent donations
  const { data: donations, error: donError } = await supabase
    .from(tableName)
    .select('name, amount, message, created_at, moderation_status')
    .eq('payment_status', 'success')
    .order('created_at', { ascending: false })
    .limit(5);

  if (donError || !donations || donations.length === 0) {
    await sendMessage(chatId, '📋 No recent donations found.', botToken);
    return;
  }

  let messageText = `📊 *Recent Donations for ${moderator.streamers?.streamer_name}*\n\n`;
  
  for (const donation of donations) {
    const time = new Date(donation.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    messageText += `💰 ₹${donation.amount} from *${donation.name}*\n`;
    if (donation.message) {
      messageText += `   💬 "${donation.message.substring(0, 50)}${donation.message.length > 50 ? '...' : ''}"\n`;
    }
    messageText += `   ⏰ ${time}\n\n`;
  }

  await sendMessage(chatId, messageText, botToken, 'Markdown');
}

// Show donation statistics
async function showDonationStats(chatId: number, userId: string, supabase: any, botToken: string) {
  const { data: moderator, error: modError } = await supabase
    .from('streamers_moderators')
    .select('streamer_id, streamers(streamer_slug, streamer_name)')
    .eq('telegram_user_id', userId)
    .eq('is_active', true)
    .single();

  if (modError || !moderator) {
    await sendMessage(chatId, '❌ You are not registered as a moderator for any streamer.', botToken);
    return;
  }

  const streamerSlug = moderator.streamers?.streamer_slug;
  const tableName = `${streamerSlug?.replace(/-/g, '_')}_donations`;

  // Get today's start
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch all successful donations
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

  const messageText = 
    `📊 *Stats for ${moderator.streamers?.streamer_name}*\n\n` +
    `💰 Total Revenue: ₹${totalRevenue.toFixed(2)}\n` +
    `📈 Total Donations: ${donations.length}\n` +
    `📅 Today's Revenue: ₹${todayRevenue.toFixed(2)}\n` +
    `🎯 Today's Donations: ${todayDonations.length}\n` +
    `💵 Average: ₹${donations.length > 0 ? (totalRevenue / donations.length).toFixed(2) : 0}`;

  await sendMessage(chatId, messageText, botToken, 'Markdown');
}

// Show moderator status
async function showModeratorStatus(chatId: number, userId: string, supabase: any, botToken: string) {
  const { data: moderator, error } = await supabase
    .from('streamers_moderators')
    .select('mod_name, is_active, created_at, streamers(streamer_name, streamer_slug)')
    .eq('telegram_user_id', userId)
    .single();

  if (error || !moderator) {
    await sendMessage(chatId, 
      '❌ You are not registered as a moderator.\n\n' +
      'Contact the streamer to add you as a moderator.', 
      botToken
    );
    return;
  }

  const status = moderator.is_active ? '✅ Active' : '❌ Inactive';
  const since = new Date(moderator.created_at).toLocaleDateString('en-IN');

  const messageText = 
    `👤 *Moderator Status*\n\n` +
    `📛 Name: *${moderator.mod_name}*\n` +
    `🎮 Streamer: *${moderator.streamers?.streamer_name}*\n` +
    `📊 Status: ${status}\n` +
    `📅 Since: ${since}\n\n` +
    `ℹ️ All donations are now auto-approved and sent to OBS immediately.`;

  await sendMessage(chatId, messageText, botToken, 'Markdown');
}

// Helper to send Telegram messages
async function sendMessage(chatId: number, text: string, botToken: string, parseMode: string = 'HTML') {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: parseMode
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send message:', errorText);
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
}
