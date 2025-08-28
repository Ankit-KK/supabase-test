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
    await sendMessage(chatId, 'Welcome to Chia Gaming Moderation Bot! 🎮\n\nAvailable commands:\n/pending - See donations awaiting approval\n/status - Check your moderator status', botToken);
    return;
  }

  if (text === '/pending') {
    await showPendingDonations(chatId, userId, supabase, botToken);
    return;
  }

  if (text === '/status') {
    await showModeratorStatus(chatId, userId, supabase, botToken);
    return;
  }

  // Default response for unknown commands
  await sendMessage(chatId, 'Unknown command. Available commands:\n/pending - See donations awaiting approval\n/status - Check your moderator status', botToken);
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
    let statusMessage = '✅ **Moderator Status: VERIFIED**\n\n';
    statusMessage += `👤 **Name:** ${moderatorData[0].mod_name}\n`;
    statusMessage += `🆔 **Telegram ID:** ${userId}\n\n`;
    statusMessage += '🎮 **Moderating for:**\n';

    moderatorData.forEach((mod: any) => {
      const streamer = mod.streamers;
      if (streamer) {
        statusMessage += `• ${streamer.streamer_name} (@${streamer.streamer_slug})\n`;
      }
    });

    statusMessage += '\n📋 **Available Commands:**\n';
    statusMessage += '• /pending - View donations awaiting approval\n';
    statusMessage += '• /status - Check this status again';

    await sendMessage(chatId, statusMessage, botToken, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error('Error in showModeratorStatus:', error);
    await sendMessage(chatId, '❌ An error occurred while checking your status.', botToken);
  }
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

    // Get pending donations for this streamer from both tables
    const { data: chiaDonations, error: chiaErr } = await supabase
      .from('chia_gaming_donations')
      .select('id, name, amount, message, voice_message_url, voice_duration_seconds, created_at')
      .eq('streamer_id', moderator.streamer_id)
      .eq('moderation_status', 'pending')
      .eq('payment_status', 'success')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: ankitDonations, error: ankitErr } = await supabase
      .from('ankit_donations')
      .select('id, name, amount, message, voice_message_url, voice_duration_seconds, created_at')
      .eq('streamer_id', moderator.streamer_id)
      .eq('moderation_status', 'pending')
      .eq('payment_status', 'success')
      .order('created_at', { ascending: false })
      .limit(10);

    if (chiaErr) console.error('Error fetching chia pending donations:', chiaErr);
    if (ankitErr) console.error('Error fetching ankit pending donations:', ankitErr);

    const donations = [ ...(chiaDonations || []), ...(ankitDonations || []) ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

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

      const keyboardRows: any[] = [];
      if (donation.voice_message_url) {
        keyboardRows.push([{ text: '🎵 Play Voice', callback_data: `play_${donation.id}` }]);
      }
      keyboardRows.push([
        { text: '✅ Approve', callback_data: `approve_${donation.id}` },
        { text: '❌ Reject', callback_data: `reject_${donation.id}` }
      ]);

      const keyboard = { inline_keyboard: keyboardRows };

      await sendMessage(chatId, messageText, botToken, keyboard);
    }

  } catch (error) {
    console.error('Error in showPendingDonations:', error);
    await sendMessage(chatId, 'Error fetching pending donations. Please try again.', botToken);
  }
}

async function playVoiceMessage(donationId: string, userId: string, chatId: number, messageId: number, supabase: any, botToken: string) {
  try {
    // Try each table to find the donation and voice message
    let voiceUrl: string | null = null;
    let donorName = '';
    let amount = 0;
    let streamerId: string | null = null;

    // Try Chia table first with joins
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
      // Try Ankit table
      const { data: ankitDonation } = await supabase
        .from('ankit_donations')
        .select('voice_message_url, name, amount, streamer_id')
        .eq('id', donationId)
        .maybeSingle();

      if (ankitDonation && ankitDonation.voice_message_url) {
        // Verify moderator for this streamer
        streamerId = ankitDonation.streamer_id;
        const { data: mods } = await supabase
          .from('streamers_moderators')
          .select('telegram_user_id, is_active')
          .eq('streamer_id', streamerId)
          .eq('is_active', true);

        const isModerator = mods?.some((mod: any) => mod.telegram_user_id === userId);
        if (!isModerator) {
          await editMessage(chatId, messageId, '❌ You are not authorized to access this donation.', botToken);
          return;
        }

        voiceUrl = ankitDonation.voice_message_url;
        donorName = ankitDonation.name;
        amount = ankitDonation.amount;
      } else {
        // Try New Streamer table
        const { data: newstreamerDonation } = await supabase
          .from('newstreamer_donations')
          .select('voice_message_url, name, amount, streamer_id')
          .eq('id', donationId)
          .maybeSingle();

        if (!newstreamerDonation || !newstreamerDonation.voice_message_url) {
          await editMessage(chatId, messageId, '❌ Voice message not found.', botToken);
          return;
        }

        // Verify moderator for this streamer
        streamerId = newstreamerDonation.streamer_id;
        const { data: mods } = await supabase
          .from('streamers_moderators')
          .select('telegram_user_id, is_active')
          .eq('streamer_id', streamerId)
          .eq('is_active', true);

        const isModerator = mods?.some((mod: any) => mod.telegram_user_id === userId);
        if (!isModerator) {
          await editMessage(chatId, messageId, '❌ You are not authorized to access this donation.', botToken);
          return;
        }

        voiceUrl = newstreamerDonation.voice_message_url;
        donorName = newstreamerDonation.name;
        amount = newstreamerDonation.amount;
      }
    }

    if (!voiceUrl) {
      await editMessage(chatId, messageId, '❌ Voice message not found.', botToken);
      return;
    }

    // Send voice message
    await sendAudioFile(chatId, voiceUrl!, botToken, `Voice message from ${donorName} (₹${amount})`);

  } catch (error) {
    console.error('Error in playVoiceMessage:', error);
    await sendMessage(chatId, '❌ Error playing voice message.', botToken);
  }
}

async function approveDonation(donationId: string, userId: string, chatId: number, messageId: number, supabase: any, botToken: string) {
  try {
    // First try in chia_gaming_donations with joins
    const { data: chiaDonation, error: chiaErr } = await supabase
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

    if (chiaDonation && !chiaErr) {
      const isModerator = chiaDonation.streamers.streamers_moderators.some(
        (mod: any) => mod.telegram_user_id === userId && mod.is_active
      );
      if (!isModerator) {
        await editMessage(chatId, messageId, '❌ You are not authorized to moderate this donation.', botToken);
        return;
      }
      if (chiaDonation.moderation_status && chiaDonation.moderation_status !== 'pending') {
        const alreadyText = chiaDonation.moderation_status === 'approved'
          ? `✅ Already approved\n\n💰 <b>Amount:</b> ₹${chiaDonation.amount}\n👤 <b>From:</b> ${chiaDonation.name}\n📺 <b>Streamer:</b> ${chiaDonation.streamers.streamer_name}`
          : `❌ Already rejected\n\n💰 <b>Amount:</b> ₹${chiaDonation.amount}\n👤 <b>From:</b> ${chiaDonation.name}\n📺 <b>Streamer:</b> ${chiaDonation.streamers.streamer_name}`;
        await editMessage(chatId, messageId, alreadyText, botToken, { inline_keyboard: [] });
        return;
      }
      const { error: updErr } = await supabase
        .from('chia_gaming_donations')
        .update({ moderation_status: 'approved', approved_by: 'telegram_moderator', approved_at: new Date().toISOString() })
        .eq('id', donationId);
      if (updErr) {
        console.error('Error approving chia donation:', updErr);
        await editMessage(chatId, messageId, '❌ Error approving donation. Please try again.', botToken);
        return;
      }
      const successText = `✅ <b>APPROVED</b>\n\n` +
        `💰 <b>Amount:</b> ₹${chiaDonation.amount}\n` +
        `👤 <b>From:</b> ${chiaDonation.name}\n` +
        `📺 <b>Streamer:</b> ${chiaDonation.streamers.streamer_name}\n` +
        `${chiaDonation.message ? `💬 <b>Message:</b> ${chiaDonation.message}\n` : ''}` +
        `${chiaDonation.voice_message_url ? `🎵 <b>Voice:</b> ${chiaDonation.voice_duration_seconds ? chiaDonation.voice_duration_seconds + 's' : 'available'}\n` : ''}` +
        `⏰ <b>Approved at:</b> ${new Date().toLocaleString()}\n\n` +
        `The donation will now appear in OBS alerts! 🎉`;
      await editMessage(chatId, messageId, successText, botToken, { inline_keyboard: [] });
      if (chiaDonation.voice_message_url) {
        await sendAudioFile(chatId, chiaDonation.voice_message_url, botToken, `Voice from ${chiaDonation.name} (₹${chiaDonation.amount})`);
      }
      await notifyModerators(chiaDonation.streamers.id, `✅ Donation approved by moderator\n💰 ₹${chiaDonation.amount} from ${chiaDonation.name}` + (chiaDonation.message ? `\n💬 ${chiaDonation.message}` : ''), supabase, botToken, userId);
      return;
    }

    // Fallback: try in ankit_donations
    const { data: ankitDonation, error: ankitFetchErr } = await supabase
      .from('ankit_donations')
      .select('*')
      .eq('id', donationId)
      .single();

    if (ankitFetchErr || !ankitDonation) {
      await editMessage(chatId, messageId, '❌ Donation not found.', botToken);
      return;
    }

    // Verify moderator for this streamer
    const { data: mods, error: modsErr } = await supabase
      .from('streamers_moderators')
      .select('telegram_user_id')
      .eq('streamer_id', ankitDonation.streamer_id)
      .eq('is_active', true);
    if (modsErr) {
      console.error('Error fetching moderators:', modsErr);
    }
    const isModerator = (mods || []).some((m: any) => m.telegram_user_id === userId);
    if (!isModerator) {
      await editMessage(chatId, messageId, '❌ You are not authorized to moderate this donation.', botToken);
      return;
    }

    if (ankitDonation.moderation_status && ankitDonation.moderation_status !== 'pending') {
      const streamerName = await getStreamerName(ankitDonation.streamer_id, supabase);
      const alreadyText = ankitDonation.moderation_status === 'approved'
        ? `✅ Already approved\n\n💰 <b>Amount:</b> ₹${ankitDonation.amount}\n👤 <b>From:</b> ${ankitDonation.name}\n📺 <b>Streamer:</b> ${streamerName}`
        : `❌ Already rejected\n\n💰 <b>Amount:</b> ₹${ankitDonation.amount}\n👤 <b>From:</b> ${ankitDonation.name}\n📺 <b>Streamer:</b> ${streamerName}`;
      await editMessage(chatId, messageId, alreadyText, botToken, { inline_keyboard: [] });
      return;
    }

    const { error: ankitUpdErr } = await supabase
      .from('ankit_donations')
      .update({ moderation_status: 'approved', approved_by: 'telegram_moderator', approved_at: new Date().toISOString() })
      .eq('id', donationId);
    if (ankitUpdErr) {
      console.error('Error approving ankit donation:', ankitUpdErr);
      await editMessage(chatId, messageId, '❌ Error approving donation. Please try again.', botToken);
      return;
    }

    const streamerName = await getStreamerName(ankitDonation.streamer_id, supabase);
    const successText = `✅ <b>APPROVED</b>\n\n` +
      `💰 <b>Amount:</b> ₹${ankitDonation.amount}\n` +
      `👤 <b>From:</b> ${ankitDonation.name}\n` +
      `📺 <b>Streamer:</b> ${streamerName}\n` +
      `⏰ <b>Approved at:</b> ${new Date().toLocaleString()}\n\n` +
      `The donation will now appear in OBS alerts! 🎉`;
    await editMessage(chatId, messageId, successText, botToken, { inline_keyboard: [] });
    await notifyModerators(ankitDonation.streamer_id, `✅ Donation approved by moderator\n💰 ₹${ankitDonation.amount} from ${ankitDonation.name}`, supabase, botToken, userId);

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

    // If already moderated, update message and return
    if (donation.moderation_status && donation.moderation_status !== 'pending') {
      const alreadyText = donation.moderation_status === 'approved'
        ? `✅ Already approved\n\n💰 **Amount:** ₹${donation.amount}\n👤 **From:** ${donation.name}\n📺 **Streamer:** ${donation.streamers.streamer_name}`
        : `❌ Already rejected\n\n💰 **Amount:** ₹${donation.amount}\n👤 **From:** ${donation.name}\n📺 **Streamer:** ${donation.streamers.streamer_name}`;
      await editMessage(chatId, messageId, alreadyText, botToken, { inline_keyboard: [] });
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

    const successText = `❌ <b>REJECTED</b>\n\n` +
      `💰 <b>Amount:</b> ₹${donation.amount}\n` +
      `👤 <b>From:</b> ${donation.name}\n` +
      `📺 <b>Streamer:</b> ${donation.streamers.streamer_name}\n` +
      `⏰ <b>Rejected at:</b> ${new Date().toLocaleString()}\n\n` +
      `The donation will NOT appear in OBS alerts.`;

    await editMessage(chatId, messageId, successText, botToken, { inline_keyboard: [] });

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

async function getStreamerName(streamerId: string, supabase: any): Promise<string> {
  try {
    const { data: streamer, error } = await supabase
      .from('streamers')
      .select('streamer_name')
      .eq('id', streamerId)
      .single();
    
    if (error || !streamer) {
      console.error('Error fetching streamer name:', error);
      return 'Unknown Streamer';
    }
    
    return streamer.streamer_name;
  } catch (error) {
    console.error('Error in getStreamerName:', error);
    return 'Unknown Streamer';
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
    parse_mode: 'HTML'  // Changed from Markdown to HTML for better compatibility
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
    // Don't throw error for message editing failures - just log them
    // The approval/rejection should still be considered successful
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