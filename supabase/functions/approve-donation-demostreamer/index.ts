import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to notify Telegram moderators
async function notifyTelegramModerators(streamerId: string, message: string, supabase: any) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    console.log('Telegram bot token not configured, skipping moderator notifications');
    return;
  }

  try {
    // Get active moderators for this streamer
    const { data: moderators, error } = await supabase
      .from('streamers_moderators')
      .select('telegram_user_id')
      .eq('streamer_id', streamerId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching moderators:', error);
      return;
    }

    // Send notification to each moderator
    for (const moderator of moderators || []) {
      try {
        const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        await fetch(telegramUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: moderator.telegram_user_id,
            text: message,
            parse_mode: 'HTML'
          })
        });
      } catch (err) {
        console.error('Error sending telegram message:', err);
      }
    }
  } catch (error) {
    console.error('Error in notifyTelegramModerators:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { donation_id, streamer_session } = await req.json();

    if (!donation_id || !streamer_session) {
      throw new Error('Missing required parameters');
    }

    console.log(`Approving donation ${donation_id}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify streamer session and get donation
    const { data: donation, error: fetchError } = await supabase
      .from('demostreamer_donations')
      .select('*, streamers!inner(id, streamer_slug)')
      .eq('id', donation_id)
      .eq('streamers.streamer_slug', streamer_session.streamerSlug)
      .single();

    if (fetchError || !donation) {
      throw new Error('Donation not found or access denied');
    }

    // Update donation status
    const { error: updateError } = await supabase
      .from('demostreamer_donations')
      .update({
        moderation_status: 'approved',
        approved_by: streamer_session.streamerSlug,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', donation_id);

    if (updateError) {
      throw new Error('Failed to approve donation');
    }

    // Notify moderators about the approval
    const notificationMessage = `✅ <b>Donation Approved</b>\n\n` +
      `💰 Amount: ₹${donation.amount}\n` +
      `👤 From: ${donation.name}\n` +
      `💬 Message: ${donation.message || 'No message'}\n` +
      `👨‍💼 Approved by: ${streamer_session.streamerSlug}`;

    await notifyTelegramModerators(donation.streamer_id, notificationMessage, supabase);

    console.log(`Donation ${donation_id} approved successfully`);

    // Broadcast alert to OBS WebSocket connections
    try {
      console.log('📡 Broadcasting WebSocket alert for approved DemoStreamer donation');
      const broadcastResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/obs-alerts-ws`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
        },
        body: JSON.stringify({
          streamer_slug: streamer_session.streamerSlug,
          donation_id: donation.id,
          donation: donation
        })
      });

      if (broadcastResponse.ok) {
        console.log('✅ WebSocket alert broadcast successful');
      } else {
        console.error('❌ WebSocket alert broadcast failed:', await broadcastResponse.text());
      }
    } catch (broadcastError) {
      console.error('❌ Error broadcasting WebSocket alert:', broadcastError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Donation approved successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in approve-donation-demostreamer:', error);
    
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