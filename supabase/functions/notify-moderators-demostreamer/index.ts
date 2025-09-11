import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { donation_id } = await req.json();

    if (!donation_id) {
      throw new Error('Missing donation_id');
    }

    console.log(`Notifying moderators for donation ${donation_id}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get donation details
    const { data: donation, error: fetchError } = await supabase
      .from('demostreamer_donations')
      .select('*')
      .eq('id', donation_id)
      .single();

    if (fetchError || !donation) {
      throw new Error('Donation not found');
    }

    // Skip notification for auto-approved hyperemotes or already notified donations
    if (donation.moderation_status === 'auto_approved' || donation.mod_notified) {
      console.log('Skipping notification - already processed or auto-approved');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Notification skipped - already processed'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get Telegram bot token
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      console.log('Telegram bot token not configured, skipping notifications');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Telegram bot not configured'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get active moderators for this streamer
    const { data: moderators, error: moderatorsError } = await supabase
      .from('streamers_moderators')
      .select('telegram_user_id')
      .eq('streamer_id', donation.streamer_id)
      .eq('is_active', true);

    if (moderatorsError) {
      console.error('Error fetching moderators:', moderatorsError);
      throw new Error('Failed to fetch moderators');
    }

    if (!moderators || moderators.length === 0) {
      console.log('No active moderators found for this streamer');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No active moderators found'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Prepare notification message
    const message = `🔔 <b>New Donation Received!</b>\n\n` +
      `💰 Amount: ₹${donation.amount}\n` +
      `👤 From: ${donation.name}\n` +
      `💬 Message: ${donation.message || 'No message'}\n` +
      `⏰ Time: ${new Date(donation.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;

    // Create inline keyboard for actions
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🔊 Play Voice',
            callback_data: `play_voice_demostreamer_${donation.id}`
          }
        ],
        [
          {
            text: '✅ Approve',
            callback_data: `approve_demostreamer_${donation.id}`
          },
          {
            text: '❌ Reject',
            callback_data: `reject_demostreamer_${donation.id}`
          }
        ]
      ]
    };

    let successfulNotifications = 0;

    // Send notification to each moderator
    for (const moderator of moderators) {
      try {
        const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await fetch(telegramUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chat_id: moderator.telegram_user_id,
            text: message,
            parse_mode: 'HTML',
            reply_markup: keyboard
          })
        });

        if (response.ok) {
          successfulNotifications++;
          console.log(`Notification sent successfully to moderator ${moderator.telegram_user_id}`);
        } else {
          console.error(`Failed to send notification to ${moderator.telegram_user_id}:`, await response.text());
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error sending notification to ${moderator.telegram_user_id}:`, error);
      }
    }

    // Mark as notified if at least one notification was sent
    if (successfulNotifications > 0) {
      await supabase
        .from('demostreamer_donations')
        .update({ mod_notified: true })
        .eq('id', donation_id);

      console.log(`Moderators notified successfully for donation ${donation_id}`);
    }

    return new Response(
      JSON.stringify({
        success: successfulNotifications > 0,
        notified_count: successfulNotifications,
        total_moderators: moderators.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in notify-moderators-demostreamer:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});