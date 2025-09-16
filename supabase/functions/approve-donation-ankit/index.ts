import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to notify moderators via Telegram
async function notifyTelegramModerators(streamerId: string, message: string, supabase: any) {
  try {
    const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!telegramBotToken) {
      console.log('No Telegram bot token configured, skipping notification');
      return;
    }

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

    // Send message to each moderator
    for (const moderator of moderators || []) {
      if (moderator.telegram_user_id) {
        try {
          await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: moderator.telegram_user_id,
              text: message,
              parse_mode: 'HTML'
            })
          });
        } catch (err) {
          console.error('Error sending Telegram message:', err);
        }
      }
    }
  } catch (error) {
    console.error('Error in notifyTelegramModerators:', error);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { donation_id, streamer_session } = await req.json();
    
    if (!donation_id || !streamer_session) {
      throw new Error("Missing required parameters");
    }

    // Create Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get donation record and verify it belongs to the authenticated streamer
    const { data: donation, error: fetchError } = await supabaseAdmin
      .from('ankit_donations')
      .select('*')
      .eq('id', donation_id)
      .single();

    if (fetchError || !donation) {
      throw new Error("Donation not found");
    }

    // Verify the donation belongs to the streamer in the current session (by slug)
    const { data: streamer, error: streamerError } = await supabaseAdmin
      .from('streamers')
      .select('id, streamer_slug, streamer_name')
      .eq('id', donation.streamer_id)
      .single();

    if (streamerError || !streamer || streamer.streamer_slug !== streamer_session.streamerSlug) {
      throw new Error("Donation not found or access denied");
    }

    if (fetchError || !donation) {
      throw new Error("Donation not found or access denied");
    }

    // Update donation status to approved
    const { data: updatedDonation, error: updateError } = await supabaseAdmin
      .from('ankit_donations')
      .update({
        moderation_status: 'approved',
        approved_by: streamer_session.streamerName,
        approved_at: new Date().toISOString()
      })
      .eq('id', donation_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating donation:', updateError);
      throw new Error("Failed to approve donation");
    }

    console.log('Donation approved:', updatedDonation);

    // Notify moderators about the approval
    const notificationMessage = `
✅ <b>Donation Approved!</b>

💰 <b>Amount:</b> ₹${donation.amount}
👤 <b>From:</b> ${donation.name}
💬 <b>Message:</b> ${donation.message || 'No message'}
👨‍💼 <b>Approved by:</b> ${streamer_session.streamerName}

This donation is now live on the stream!
    `.trim();
    
    await notifyTelegramModerators(donation.streamer_id, notificationMessage, supabaseAdmin);

    // Broadcast WebSocket alert for OBS
    console.log('📡 Broadcasting WebSocket alert for approved donation:', {
      donation_id: updatedDonation.id,
      streamer_slug: 'ankit',
      donation_amount: updatedDonation.amount
    });
    
    try {
      const { data: wsResponse, error: wsError } = await supabaseAdmin.functions.invoke('obs-alerts-ws', {
        body: { 
          streamer_slug: 'ankit',
          donation: updatedDonation
        }
      });
      
      if (wsError) {
        console.error('❌ WebSocket function invoke error:', wsError);
      } else {
        console.log('✅ WebSocket alert broadcast response:', wsResponse);
      }
    } catch (wsError) {
      console.error('❌ WebSocket alert broadcast exception:', wsError);
      // Log the full error details
      console.error('❌ Error details:', {
        message: wsError.message,
        stack: wsError.stack,
        name: wsError.name
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Donation approved successfully",
        donation: updatedDonation
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error approving donation:', error);
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