import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { donation_id } = await req.json();
    
    if (!donation_id) {
      throw new Error("Donation ID is required");
    }

    // Create Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get donation record
    const { data: donation, error: fetchError } = await supabaseAdmin
      .from('ankit_donations')
      .select('*')
      .eq('id', donation_id)
      .single();

    if (fetchError || !donation) {
      throw new Error("Donation not found");
    }

    // Skip notifications for auto-approved hyperemotes
    if (donation.is_hyperemote && donation.moderation_status === 'auto_approved') {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Auto-approved hyperemote - no notification needed",
          auto_approved: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already notified
    if (donation.mod_notified) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Moderators already notified",
          already_notified: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!telegramBotToken) {
      throw new Error('No Telegram bot token configured');
    }

    // Get active moderators for this streamer
    const { data: moderators, error: modErr } = await supabaseAdmin
      .from('streamers_moderators')
      .select('telegram_user_id, mod_name')
      .eq('streamer_id', donation.streamer_id)
      .eq('is_active', true);

    if (modErr) {
      console.error('Error fetching moderators:', modErr);
      throw new Error('Failed to fetch moderators');
    }

    if (!moderators || moderators.length === 0) {
      throw new Error('No active moderators found');
    }

    console.log(`Sending notifications to ${moderators.length} moderators for donation ${donation_id}`);

    const messageText = `🎁 <b>New Donation</b>\n\n💰 <b>Amount:</b> ₹${donation.amount}\n👤 <b>From:</b> ${donation.name}${donation.message ? `\n💬 <b>Message:</b> ${donation.message}` : ''}${donation.voice_message_url ? `\n🎵 <b>Voice:</b> ${donation.voice_duration_seconds ? donation.voice_duration_seconds + 's' : 'available'}` : ''}`;
    const hasVoice = Boolean(
      donation.voice_message_url ||
      donation.temp_voice_data ||
      (donation.voice_duration_seconds && donation.voice_duration_seconds > 0) ||
      (donation.message && donation.message.toLowerCase().includes('voice'))
    );
    const inlineKeyboard = {
      inline_keyboard: [
        ...(hasVoice ? [[{ text: '🎵 Play Voice', callback_data: `play_${donation.id}` }]] : []),
        [
          { text: '✅ Approve', callback_data: `approve_${donation.id}` },
          { text: '❌ Reject', callback_data: `reject_${donation.id}` }
        ]
      ]
    };

    let successCount = 0;
    let errorCount = 0;

    for (const moderator of moderators) {
      if (!moderator.telegram_user_id) continue;
      
      try {
        console.log(`Sending notification to moderator ${moderator.mod_name} (${moderator.telegram_user_id})`);
        
        const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: moderator.telegram_user_id,
            text: messageText,
            parse_mode: 'HTML',
            reply_markup: inlineKeyboard
          })
        });

        const result = await response.json();
        
        if (response.ok) {
          console.log(`Successfully sent notification to ${moderator.mod_name}`);
          successCount++;
        } else {
          console.error(`Failed to send notification to ${moderator.mod_name}:`, result);
          errorCount++;
        }
      } catch (err) {
        console.error(`Error sending notification to ${moderator.mod_name}:`, err);
        errorCount++;
      }
    }

    // Mark as notified if at least one message was sent successfully
    if (successCount > 0) {
      await supabaseAdmin
        .from('ankit_donations')
        .update({ mod_notified: true })
        .eq('id', donation_id);
      console.log(`Marked donation ${donation_id} as mod_notified`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notifications sent to ${successCount} moderators`,
        success_count: successCount,
        error_count: errorCount,
        total_moderators: moderators.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error notifying moderators:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});