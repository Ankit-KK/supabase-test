import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('notify-pending-donations: function loaded');

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

    const { donationId, tableName, streamerId, donationData } = await req.json();
    
    console.log('Notify pending donation:', { donationId, tableName, streamerId });

    if (!donationId || !tableName || !streamerId) {
      throw new Error('Missing required parameters: donationId, tableName, streamerId');
    }

    // Check if telegram moderation is enabled for this streamer
    const { data: streamerData, error: streamerError } = await supabaseAdmin
      .from('streamers')
      .select('telegram_moderation_enabled, streamer_name, streamer_slug')
      .eq('id', streamerId)
      .single();

    if (streamerError || !streamerData) {
      console.log('Streamer not found or error:', streamerError);
      return new Response(
        JSON.stringify({ success: false, error: 'Streamer not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!streamerData.telegram_moderation_enabled) {
      console.log('Telegram moderation is disabled for streamer:', streamerId);
      return new Response(
        JSON.stringify({ success: true, message: 'Telegram moderation disabled, skipping' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get donation data if not provided
    let donation = donationData;
    if (!donation) {
      const { data: donationResult, error: donationError } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .eq('id', donationId)
        .single();

      if (donationError || !donationResult) {
        console.log('Donation not found:', donationError);
        return new Response(
          JSON.stringify({ success: false, error: 'Donation not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      donation = donationResult;
    }

    // Get active moderators for this streamer
    const { data: moderators, error: modError } = await supabaseAdmin
      .from('streamers_moderators')
      .select('telegram_user_id, mod_name')
      .eq('streamer_id', streamerId)
      .eq('is_active', true);

    if (modError || !moderators || moderators.length === 0) {
      console.log('No active moderators found for streamer:', streamerId);
      return new Response(
        JSON.stringify({ success: true, message: 'No moderators to notify' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build message with donation details
    const hasVoice = !!donation.voice_message_url;
    const hasHypersound = !!donation.hypersound_url;
    const isHyperemote = donation.is_hyperemote;

    let donationType = '💬 Text Donation';
    if (hasVoice) donationType = '🎤 Voice Donation';
    if (hasHypersound) donationType = '🔊 HyperSound';
    if (isHyperemote) donationType = '✨ HyperEmote';

    const messageText = 
      `⏳ <b>NEW DONATION - NEEDS APPROVAL</b>\n\n` +
      `${donationType}\n\n` +
      `💰 <b>Amount:</b> ₹${donation.amount}\n` +
      `👤 <b>From:</b> ${escapeHtml(donation.name)}\n` +
      `💬 <b>Message:</b> ${donation.message ? escapeHtml(donation.message.substring(0, 200)) : '<i>No message</i>'}\n` +
      `${hasVoice ? '🎵 <b>Has voice message</b>\n' : ''}` +
      `${hasHypersound ? '🔊 <b>Has HyperSound</b>\n' : ''}` +
      `\n🎮 <b>Streamer:</b> ${escapeHtml(streamerData.streamer_name)}\n` +
      `⏰ <b>Time:</b> ${new Date(donation.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\n` +
      `⚡ <b>Use buttons below to moderate:</b>`;

    // Build inline keyboard with Approve/Reject buttons
    const inlineKeyboard: any[][] = [
      [
        { text: '✅ Approve', callback_data: `approve_${tableName}_${donationId}` },
        { text: '❌ Reject', callback_data: `reject_${tableName}_${donationId}` }
      ]
    ];

    // Add Play Voice button if voice message exists
    if (hasVoice) {
      inlineKeyboard.push([
        { text: '🎵 Play Voice', callback_data: `play_${donationId}` }
      ]);
    }

    // Add Hide Message button
    inlineKeyboard.push([
      { text: '👁️ Hide Message', callback_data: `hide_${tableName}_${donationId}` }
    ]);

    const replyMarkup = { inline_keyboard: inlineKeyboard };

    // Send notification to all moderators
    const sendPromises = moderators.map(mod => 
      sendTelegramMessage(mod.telegram_user_id, messageText, botToken, replyMarkup)
    );

    const results = await Promise.allSettled(sendPromises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failCount = results.filter(r => r.status === 'rejected').length;

    console.log(`Notification sent to ${successCount} moderators, ${failCount} failed`);

    // Mark donation as mod_notified
    await supabaseAdmin
      .from(tableName)
      .update({ mod_notified: true })
      .eq('id', donationId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notified ${successCount} moderators`,
        sent: successCount,
        failed: failCount
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in notify-pending-donations:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function escapeHtml(input: string = ''): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendTelegramMessage(chatId: string, text: string, botToken: string, replyMarkup?: any) {
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
    console.error('Error sending Telegram message to', chatId, ':', error);
    throw new Error(`Failed to send message: ${error}`);
  }

  return await response.json();
}
