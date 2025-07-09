import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    message: {
      message_id: number;
      chat: {
        id: number;
      };
    };
    data: string;
  };
}

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  created_at: string;
  gif_url?: string;
  voice_url?: string;
  custom_sound_name?: string;
  include_sound?: boolean;
  order_id: string;
}

class TelegramBot {
  private token: string;
  private supabase: any;
  private apiUrl: string;

  constructor(token: string, supabaseUrl: string, supabaseKey: string) {
    this.token = token;
    this.apiUrl = `https://api.telegram.org/bot${token}`;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async sendMessage(chatId: number, text: string, replyMarkup?: any) {
    const response = await fetch(`${this.apiUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup: replyMarkup,
        parse_mode: 'HTML'
      })
    });
    return response.json();
  }

  async editMessageReplyMarkup(chatId: number, messageId: number, replyMarkup?: any) {
    const response = await fetch(`${this.apiUrl}/editMessageReplyMarkup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        reply_markup: replyMarkup
      })
    });
    return response.json();
  }

  async answerCallbackQuery(callbackQueryId: string, text: string, showAlert = false) {
    const response = await fetch(`${this.apiUrl}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert
      })
    });
    return response.json();
  }

  async getModerators(streamerId: string) {
    const { data, error } = await this.supabase
      .from('moderators')
      .select('telegram_id, telegram_username')
      .eq('streamer_id', streamerId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching moderators:', error);
      return [];
    }
    return data || [];
  }

  async isModerator(telegramId: number, streamerId: string) {
    const { data, error } = await this.supabase
      .rpc('is_moderator', { 
        p_telegram_id: telegramId, 
        p_streamer_id: streamerId 
      });

    if (error) {
      console.error('Error checking moderator status:', error);
      return false;
    }
    return data || false;
  }

  formatDonationMessage(donation: Donation): string {
    const features = [];
    if (donation.gif_url) features.push('GIF: Yes');
    if (donation.voice_url) features.push('Voice: Yes');
    if (donation.include_sound || donation.custom_sound_name) features.push('Sound: Yes');
    
    const featuresText = features.length > 0 ? `\n${features.join(' | ')}` : '';
    
    return `💸 <b>New donation from ${donation.name}</b>: '${donation.message}' ₹${donation.amount}${featuresText}\n\nOrder ID: #${donation.order_id}`;
  }

  async notifyModerators(donation: Donation, streamerId: string) {
    const moderators = await this.getModerators(streamerId);
    console.log(`Notifying ${moderators.length} moderators about donation ${donation.id}`);

    const message = this.formatDonationMessage(donation);
    const inlineKeyboard = {
      inline_keyboard: [[
        { text: '✅ Approve', callback_data: `approve_${donation.id}` },
        { text: '❌ Reject', callback_data: `reject_${donation.id}` }
      ]]
    };

    for (const moderator of moderators) {
      try {
        await this.sendMessage(moderator.telegram_id, message, inlineKeyboard);
        console.log(`Notification sent to moderator ${moderator.telegram_id}`);
      } catch (error) {
        console.error(`Failed to send notification to moderator ${moderator.telegram_id}:`, error);
      }
    }
  }

  async handleApproval(donationId: string, action: 'approve' | 'reject', moderatorId: number, callbackQueryId: string, messageId: number, chatId: number) {
    // Verify moderator permissions
    const isMod = await this.isModerator(moderatorId, 'chiaa_gaming');
    if (!isMod) {
      await this.answerCallbackQuery(callbackQueryId, 'You are not authorized to perform this action.', true);
      return;
    }

    // Get current donation status
    const { data: donation, error: fetchError } = await this.supabase
      .from('chiaa_gaming_donations')
      .select('review_status, reviewed_by')
      .eq('id', donationId)
      .single();

    if (fetchError || !donation) {
      await this.answerCallbackQuery(callbackQueryId, 'Donation not found.', true);
      return;
    }

    if (donation.review_status !== 'pending') {
      await this.answerCallbackQuery(callbackQueryId, `Donation already ${donation.review_status} by another moderator.`, true);
      return;
    }

    // Update donation status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const { error: updateError } = await this.supabase
      .from('chiaa_gaming_donations')
      .update({
        review_status: newStatus,
        reviewed_by: moderatorId.toString(),
        reviewed_at: new Date().toISOString()
      })
      .eq('id', donationId);

    if (updateError) {
      console.error('Error updating donation:', updateError);
      await this.answerCallbackQuery(callbackQueryId, 'Failed to update donation status.', true);
      return;
    }

    // Remove inline buttons and send confirmation
    await this.editMessageReplyMarkup(chatId, messageId, { inline_keyboard: [] });
    
    const statusEmoji = action === 'approve' ? '✅' : '❌';
    const confirmationText = `Donation ${action}d ${statusEmoji}`;
    await this.answerCallbackQuery(callbackQueryId, confirmationText);

    console.log(`Donation ${donationId} ${action}d by moderator ${moderatorId}`);
  }

  async handleUpdate(update: TelegramUpdate) {
    if (update.message) {
      const { message } = update;
      const chatId = message.chat.id;
      const text = message.text || '';

      if (text.startsWith('/start')) {
        const welcomeMessage = `
🤖 <b>HyperChat Moderation Bot</b>

Welcome! This bot notifies you about new donations that need approval.

Commands:
/start - Show this welcome message
/status - Check your moderator status
/help - Show available commands

You'll receive notifications for pending donations with approve/reject buttons.
        `;
        await this.sendMessage(chatId, welcomeMessage.trim());
      } else if (text.startsWith('/status')) {
        const isMod = await this.isModerator(message.from.id, 'chiaa_gaming');
        const statusText = isMod 
          ? '✅ You are an active moderator for Chiaa Gaming'
          : '❌ You are not registered as a moderator';
        await this.sendMessage(chatId, statusText);
      } else if (text.startsWith('/help')) {
        const helpMessage = `
<b>HyperChat Moderation Bot - Help</b>

<b>Commands:</b>
/start - Welcome message
/status - Check moderator status
/help - Show this help

<b>How it works:</b>
• You'll receive notifications for new donations
• Click ✅ Approve or ❌ Reject buttons
• Only registered moderators can approve/reject
• Donations are processed in real-time
        `;
        await this.sendMessage(chatId, helpMessage.trim());
      }
    } else if (update.callback_query) {
      const { callback_query } = update;
      const data = callback_query.data;
      const callbackQueryId = callback_query.id;
      const messageId = callback_query.message.message_id;
      const chatId = callback_query.message.chat.id;
      const moderatorId = callback_query.from.id;

      if (data.startsWith('approve_') || data.startsWith('reject_')) {
        const [action, donationId] = data.split('_');
        await this.handleApproval(
          donationId, 
          action as 'approve' | 'reject', 
          moderatorId, 
          callbackQueryId, 
          messageId, 
          chatId
        );
      }
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!botToken || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const bot = new TelegramBot(botToken, supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);

    if (req.method === 'POST') {
      // Handle webhook from Telegram
      if (url.pathname === '/webhook') {
        const update: TelegramUpdate = await req.json();
        console.log('Received Telegram update:', JSON.stringify(update, null, 2));
        
        await bot.handleUpdate(update);
        return new Response('OK', { headers: corsHeaders });
      }

      // Handle notification from Supabase (new donation)
      if (url.pathname === '/notify') {
        const { donation, streamer_id } = await req.json();
        console.log('Received notification for donation:', donation.id);
        
        await bot.notifyModerators(donation, streamer_id);
        return new Response('Notification sent', { headers: corsHeaders });
      }
    }

    if (req.method === 'GET') {
      if (url.pathname === '/health') {
        return new Response('Bot is running', { headers: corsHeaders });
      }

      // Set up webhook
      if (url.pathname === '/setup') {
        const webhookUrl = `${supabaseUrl.replace('/v1', '')}/functions/v1/telegram-bot/webhook`;
        const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: webhookUrl })
        });
        
        const result = await response.json();
        console.log('Webhook setup result:', result);
        
        return new Response(JSON.stringify(result), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('Error in Telegram bot:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});