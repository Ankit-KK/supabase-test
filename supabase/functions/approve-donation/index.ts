import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for elevated permissions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    
    const { data: userData } = await supabaseClient.auth.getUser(token);
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    const { donation_id } = await req.json();

    if (!donation_id) {
      throw new Error('Donation ID is required');
    }

    console.log('Approving donation:', donation_id);

    // Get donation details and verify ownership
    const { data: donation, error: fetchError } = await supabaseAdmin
      .from('chia_gaming_donations')
      .select(`
        *,
        streamers!inner(user_id)
      `)
      .eq('id', donation_id)
      .single();

    if (fetchError) {
      console.error('Error fetching donation:', fetchError);
      throw new Error('Donation not found');
    }

    // Verify user owns this streamer
    if (donation.streamers.user_id !== userData.user.id) {
      throw new Error('Unauthorized: You can only approve donations for your own stream');
    }

    // Update donation status to approved
    const { error: updateError } = await supabaseAdmin
      .from('chia_gaming_donations')
      .update({
        moderation_status: 'approved',
        approved_by: 'streamer',
        approved_at: new Date().toISOString()
      })
      .eq('id', donation_id);

    if (updateError) {
      console.error('Error updating donation:', updateError);
      throw new Error('Failed to approve donation');
    }

    console.log('Donation approved successfully:', donation_id);

    // Notify Telegram moderators
    try {
      await notifyTelegramModerators(donation.streamer_id, `✅ Donation approved via web dashboard\n💰 ₹${donation.amount} from ${donation.name}`, supabaseAdmin);
    } catch (telegramError) {
      console.error('Error notifying Telegram moderators:', telegramError);
      // Don't fail the approval if Telegram notification fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Donation approved successfully',
        donation_id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in approve-donation function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function notifyTelegramModerators(streamerId: string, message: string, supabase: any) {
  try {
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) return;

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

    // Send notification to all moderators
    for (const moderator of moderators) {
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: parseInt(moderator.telegram_user_id),
            text: message,
            parse_mode: 'Markdown'
          })
        });
      } catch (err) {
        console.error(`Error sending notification to moderator ${moderator.telegram_user_id}:`, err);
      }
    }
  } catch (error) {
    console.error('Error in notifyTelegramModerators:', error);
  }
}