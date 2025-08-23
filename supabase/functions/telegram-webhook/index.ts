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
      JSON.stringify({ error: error.message }),
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
    await sendMessage(chatId, 'Welcome to Chia Gaming Moderation Bot! 🎮\n\nUse /pending to see donations awaiting approval.', botToken);
    return;
  }

  if (text === '/pending') {
    await showPendingDonations(chatId, userId, supabase, botToken);
    return;
  }

  // Default response for unknown commands
  await sendMessage(chatId, 'Unknown command. Use /pending to see donations awaiting approval.', botToken);
}

async function handleCallbackQuery(callbackQuery: any, supabase: any, botToken: string) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  const userId = callbackQuery.from.id.toString();

  console.log('Handling callback query:', { chatId, messageId, data, userId });

  if (data.startsWith('approve_')) {
    const donationId = data.replace('approve_', '');
    await approveDonation(donationId, userId, chatId, messageId, supabase, botToken);
  } else if (data.startsWith('reject_')) {
    const donationId = data.replace('reject_', '');
    await rejectDonation(donationId, userId, chatId, messageId, supabase, botToken);
  } else if (data.startsWith('play_')) {
    const donationId = data.replace('play_', '');
    await playVoiceMessage(donationId, userId, chatId, messageId, supabase, botToken);
  }

  // Answer the callback query to remove the loading indicator
  await answerCallbackQuery(callbackQuery.id, botToken);
}

async function showPendingDonations(chatId: number, userId: string, supabase: any, botToken: string) {
  try {
    // Find the moderator's streamer
    const { data: moderator, error: modError } = await supabase
      .from('streamers_moderators')
      .select(`
        streamer_id,
        streamers!inner(
          id,
          streamer_name
        )
      `)
      .eq('telegram_user_id', userId)
      .eq('is_active', true)
      .single();

    if (modError || !moderator) {
      await sendMessage(chatId, 'You are not registered as a moderator. Please contact the streamer to get access.', botToken);
      return;
    }

    // Get pending donations for this streamer
    const { data: donations, error: donationsError } = await supabase
      .from('chia_gaming_donations')
      .select('id, name, amount, message, voice_message_url, voice_duration_seconds, created_at')
      .eq('streamer_id', moderator.streamer_id)
      .eq('moderation_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    if (donationsError) {
      console.error('Error fetching donations:', donationsError);
      await sendMessage(chatId, 'Error fetching pending donations. Please try again.', botToken);
      return;
    }

    if (!donations || donations.length === 0) {
      await sendMessage(chatId, `✅ No pending donations for ${moderator.streamers.streamer_name}!\n\nAll donations have been reviewed.`, botToken);
      return;
    }

    // Send each donation as a separate message with approve/reject buttons
    for (const donation of donations) {
      const messageText = `🎁 **New Donation**\n\n` +
        `💰 **Amount:** ₹${donation.amount}\n` +
        `👤 **From:** ${donation.name}\n` +
        `📅 **Time:** ${new Date(donation.created_at).toLocaleString()}\n` +
        `${donation.message ? `💬 **Message:** ${donation.message}\n` : ''}` +
        `${donation.voice_message_url ? `🎵 **Voice Message:** ${donation.voice_duration_seconds}s\n` : ''}`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '🎵 Play Voice', callback_data: `play_${donation.id}` }],
          [
            { text: '✅ Approve', callback_data: `approve_${donation.id}` },
            { text: '❌ Reject', callback_data: `reject_${donation.id}` }
          ]
        ]
      };

      await sendMessage(chatId, messageText, botToken, keyboard);
    }

  } catch (error) {
    console.error('Error in showPendingDonations:', error);
    await sendMessage(chatId, 'Error fetching pending donations. Please try again.', botToken);
  }
}

async function playVoiceMessage(donationId: string, userId: string, chatId: number, messageId: number, supabase: any, botToken: string) {
  try {
    // Verify the moderator has access to this donation
    const { data: donation, error: fetchError } = await supabase
      .from('chia_gaming_donations')
      .select(`
        voice_message_url,
        name,
        amount,
        streamers!inner(
          id,
          streamer_name,
          streamers_moderators!inner(telegram_user_id, is_active)
        )
      `)
      .eq('id', donationId)
      .single();

    if (fetchError || !donation || !donation.voice_message_url) {
      await editMessage(chatId, messageId, '❌ Voice message not found.', botToken);
      return;
    }

    // Check if user is authorized moderator
    const isModerator = donation.streamers.streamers_moderators.some(
      (mod: any) => mod.telegram_user_id === userId && mod.is_active
    );

    if (!isModerator) {
      await editMessage(chatId, messageId, '❌ You are not authorized to access this donation.', botToken);
      return;
    }

    // Send voice message
    await sendVoiceMessage(chatId, donation.voice_message_url, botToken, `Voice message from ${donation.name} (₹${donation.amount})`);

  } catch (error) {
    console.error('Error in playVoiceMessage:', error);
    await sendMessage(chatId, '❌ Error playing voice message.', botToken);
  }
}

async function approveDonation(donationId: string, userId: string, chatId: number, messageId: number, supabase: any, botToken: string) {
  try {
    // Verify the moderator has access to this donation
    const { data: donation, error: fetchError } = await supabase
      .from('chia_gaming_donations')
      .select(`
        *,
        streamers!inner(
          id,
          streamer_name,
          streamers_moderators!inner(telegram_user_id, is_active)
        )
      `)
      .eq('id', donationId)
      .single();

    if (fetchError || !donation) {
      await editMessage(chatId, messageId, '❌ Donation not found.', botToken);
      return;
    }

    // Check if user is authorized moderator
    const isModerator = donation.streamers.streamers_moderators.some(
      (mod: any) => mod.telegram_user_id === userId && mod.is_active
    );

    if (!isModerator) {
      await editMessage(chatId, messageId, '❌ You are not authorized to moderate this donation.', botToken);
      return;
    }

    // Approve the donation
    const { error: updateError } = await supabase
      .from('chia_gaming_donations')
      .update({
        moderation_status: 'approved',
        approved_by: 'telegram_moderator',
        approved_at: new Date().toISOString()
      })
      .eq('id', donationId);

    if (updateError) {
      console.error('Error approving donation:', updateError);
      await editMessage(chatId, messageId, '❌ Error approving donation. Please try again.', botToken);
      return;
    }

    const successText = `✅ **APPROVED**\n\n` +
      `💰 **Amount:** ₹${donation.amount}\n` +
      `👤 **From:** ${donation.name}\n` +
      `📺 **Streamer:** ${donation.streamers.streamer_name}\n` +
      `⏰ **Approved at:** ${new Date().toLocaleString()}\n\n` +
      `The donation will now appear in OBS alerts! 🎉`;

    await editMessage(chatId, messageId, successText, botToken);

    // Notify all moderators about the approval
    await notifyModerators(donation.streamers.id, `✅ Donation approved by moderator\n💰 ₹${donation.amount} from ${donation.name}`, supabase, botToken, userId);

  } catch (error) {
    console.error('Error in approveDonation:', error);
    await editMessage(chatId, messageId, '❌ Error approving donation.', botToken);
  }
}

async function rejectDonation(donationId: string, userId: string, chatId: number, messageId: number, supabase: any, botToken: string) {
  try {
    // Verify the moderator has access to this donation
    const { data: donation, error: fetchError } = await supabase
      .from('chia_gaming_donations')
      .select(`
        *,
        streamers!inner(
          id,
          streamer_name,
          streamers_moderators!inner(telegram_user_id, is_active)
        )
      `)
      .eq('id', donationId)
      .single();

    if (fetchError || !donation) {
      await editMessage(chatId, messageId, '❌ Donation not found.', botToken);
      return;
    }

    // Check if user is authorized moderator
    const isModerator = donation.streamers.streamers_moderators.some(
      (mod: any) => mod.telegram_user_id === userId && mod.is_active
    );

    if (!isModerator) {
      await editMessage(chatId, messageId, '❌ You are not authorized to moderate this donation.', botToken);
      return;
    }

    // Reject the donation
    const { error: updateError } = await supabase
      .from('chia_gaming_donations')
      .update({
        moderation_status: 'rejected',
        rejected_reason: 'Rejected via Telegram moderation'
      })
      .eq('id', donationId);

    if (updateError) {
      console.error('Error rejecting donation:', updateError);
      await editMessage(chatId, messageId, '❌ Error rejecting donation. Please try again.', botToken);
      return;
    }

    const successText = `❌ **REJECTED**\n\n` +
      `💰 **Amount:** ₹${donation.amount}\n` +
      `👤 **From:** ${donation.name}\n` +
      `📺 **Streamer:** ${donation.streamers.streamer_name}\n` +
      `⏰ **Rejected at:** ${new Date().toLocaleString()}\n\n` +
      `The donation will NOT appear in OBS alerts.`;

    await editMessage(chatId, messageId, successText, botToken);

    // Notify all moderators about the rejection
    await notifyModerators(donation.streamers.id, `❌ Donation rejected by moderator\n💰 ₹${donation.amount} from ${donation.name}`, supabase, botToken, userId);

  } catch (error) {
    console.error('Error in rejectDonation:', error);
    await editMessage(chatId, messageId, '❌ Error rejecting donation.', botToken);
  }
}

async function notifyModerators(streamerId: string, message: string, supabase: any, botToken: string, excludeUserId?: string) {
  try {
    // Get all active moderators for this streamer
    const { data: moderators, error } = await supabase
      .from('streamers_moderators')
      .select('telegram_user_id')
      .eq('streamer_id', streamerId)
      .eq('is_active', true);

    if (error || !moderators) {
      console.error('Error fetching moderators:', error);
      return;
    }

    // Send notification to all moderators except the one who performed the action
    for (const moderator of moderators) {
      if (moderator.telegram_user_id !== excludeUserId) {
        try {
          await sendMessage(parseInt(moderator.telegram_user_id), message, botToken);
        } catch (err) {
          console.error(`Error sending notification to moderator ${moderator.telegram_user_id}:`, err);
        }
      }
    }
  } catch (error) {
    console.error('Error in notifyModerators:', error);
  }
}

// Telegram API helper functions
async function sendMessage(chatId: number, text: string, botToken: string, replyMarkup?: any) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload: any = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown'
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

async function sendVoiceMessage(chatId: number, voiceUrl: string, botToken: string, caption?: string) {
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
    console.error('Error sending voice message:', error);
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
    parse_mode: 'Markdown'
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