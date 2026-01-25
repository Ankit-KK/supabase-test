import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto as stdCrypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModerationRequest {
  action: 'approve' | 'reject' | 'hide_message' | 'unhide_message' | 'ban_donor' | 'unban_donor' | 'replay';
  donationId: string;
  donationTable: string;
  streamerId: string;
  moderatorId?: string;
  moderatorTelegramId?: string;
  moderatorName?: string;
  source: 'telegram' | 'dashboard';
  notes?: string;
  banReason?: string;
}

// Pusher credentials by group
const PUSHER_CREDENTIALS: Record<number, { appId: string; key: string; secret: string; cluster: string }> = {
  1: {
    appId: Deno.env.get('PUSHER_APP_ID') || '',
    key: Deno.env.get('PUSHER_KEY') || '',
    secret: Deno.env.get('PUSHER_SECRET') || '',
    cluster: Deno.env.get('PUSHER_CLUSTER') || 'ap2'
  },
  2: {
    appId: Deno.env.get('PUSHER_APP_ID_2') || '',
    key: Deno.env.get('PUSHER_KEY_2') || '',
    secret: Deno.env.get('PUSHER_SECRET_2') || '',
    cluster: Deno.env.get('PUSHER_CLUSTER_2') || 'ap2'
  },
  3: {
    appId: Deno.env.get('PUSHER_APP_ID_3') || '',
    key: Deno.env.get('PUSHER_KEY_3') || '',
    secret: Deno.env.get('PUSHER_SECRET_3') || '',
    cluster: Deno.env.get('PUSHER_CLUSTER_3') || 'ap2'
  }
};

// Helper function to generate Pusher signature
async function generatePusherSignature(secret: string, stringToSign: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(stringToSign));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper function to send Pusher event
async function sendPusherEvent(
  channels: string[],
  eventName: string,
  data: any,
  pusherGroup: number = 1
): Promise<boolean> {
  try {
    const creds = PUSHER_CREDENTIALS[pusherGroup] || PUSHER_CREDENTIALS[1];
    
    if (!creds.appId || !creds.key || !creds.secret) {
      console.error(`Pusher credentials not configured for group ${pusherGroup}`);
      return false;
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body = JSON.stringify({
      name: eventName,
      channels: channels,
      data: JSON.stringify(data)
    });
    const bodyMd5 = Array.from(
      new Uint8Array(await stdCrypto.subtle.digest("MD5", new TextEncoder().encode(body)))
    ).map(b => b.toString(16).padStart(2, '0')).join('');

    const stringToSign = `POST\n/apps/${creds.appId}/events\nauth_key=${creds.key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${bodyMd5}`;
    const signature = await generatePusherSignature(creds.secret, stringToSign);

    const url = `https://api-${creds.cluster}.pusher.com/apps/${creds.appId}/events?auth_key=${creds.key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${bodyMd5}&auth_signature=${signature}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Pusher API error: ${response.status} - ${errorText}`);
      return false;
    }

    console.log(`Pusher event '${eventName}' sent to channels: ${channels.join(', ')}`);
    return true;
  } catch (error) {
    console.error('Error sending Pusher event:', error);
    return false;
  }
}

console.log('moderate-donation: function loaded');

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

    const body: ModerationRequest = await req.json();
    const { action, donationId, donationTable, streamerId, moderatorId, moderatorTelegramId, moderatorName, source, notes, banReason } = body;

    console.log('Moderation request:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!action || !donationId || !donationTable || !streamerId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields: action, donationId, donationTable, streamerId' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify moderator exists and has permission if moderatorId provided
    if (moderatorId) {
      const { data: moderator, error: modError } = await supabaseAdmin
        .from('streamers_moderators')
        .select('id, role, can_approve, can_reject, can_hide_message, can_ban, can_replay, is_active')
        .eq('id', moderatorId)
        .eq('is_active', true)
        .single();

      if (modError || !moderator) {
        console.error('Moderator not found or inactive:', modError);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Moderator not found or inactive' 
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check permission based on action
      const hasPermission = checkPermission(moderator, action);
      if (!hasPermission) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: `No permission to perform action: ${action}` 
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Get current donation state
    const { data: donation, error: donError } = await supabaseAdmin
      .from(donationTable)
      .select('*')
      .eq('id', donationId)
      .single();

    if (donError || !donation) {
      console.error('Donation not found:', donError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Donation not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch streamer info for Pusher
    const { data: streamer, error: streamerError } = await supabaseAdmin
      .from('streamers')
      .select('streamer_slug, pusher_group, tts_enabled, tts_voice_id, telegram_moderation_enabled')
      .eq('id', streamerId)
      .single();

    if (streamerError) {
      console.error('Error fetching streamer:', streamerError);
    }

    const previousStatus = donation.moderation_status;
    let newStatus = previousStatus;
    let updateData: Record<string, any> = {};
    let shouldSendOBSAlert = false;

    // Execute the action
    switch (action) {
      case 'approve':
        newStatus = 'approved';
        shouldSendOBSAlert = true;
        updateData = {
          moderation_status: 'approved',
          approved_by: moderatorName || 'moderator',
          approved_at: new Date().toISOString(),
          audio_scheduled_at: new Date().toISOString()
        };
        break;

      case 'reject':
        newStatus = 'rejected';
        updateData = {
          moderation_status: 'rejected',
          message_visible: false
        };
        break;

      case 'hide_message':
        updateData = { message_visible: false };
        break;

      case 'unhide_message':
        updateData = { message_visible: true };
        break;

      case 'ban_donor':
        // Add to banned_donors table
        const { error: banError } = await supabaseAdmin
          .from('banned_donors')
          .insert({
            streamer_id: streamerId,
            donor_name: donation.name,
            banned_by_moderator_id: moderatorId,
            banned_by_name: moderatorName,
            reason: banReason || 'Banned by moderator',
            is_active: true
          });

        if (banError) {
          console.error('Error banning donor:', banError);
        }
        
        // Also reject the current donation
        newStatus = 'rejected';
        updateData = {
          moderation_status: 'rejected',
          message_visible: false
        };
        break;

      case 'unban_donor':
        // Mark ban as inactive
        await supabaseAdmin
          .from('banned_donors')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('streamer_id', streamerId)
          .ilike('donor_name', donation.name);
        break;

      case 'replay':
        // Set audio_played_at to null and set new scheduled time to trigger replay
        shouldSendOBSAlert = true;
        updateData = { 
          audio_played_at: null,
          audio_scheduled_at: new Date().toISOString()
        };
        break;

      default:
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Unknown action: ${action}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Update the donation if there are changes
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from(donationTable)
        .update(updateData)
        .eq('id', donationId);

      if (updateError) {
        console.error('Error updating donation:', updateError);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Failed to update donation' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Send OBS alert if needed (approve or replay actions)
    if (shouldSendOBSAlert && streamer) {
      const channelSlug = streamer.streamer_slug;
      const pusherGroup = streamer.pusher_group || 1;

      // Determine donation type
      let donationType: 'text' | 'voice' | 'hypersound' | 'media' = 'text';
      if (donation.media_url) {
        donationType = 'media';
      } else if (donation.voice_message_url) {
        donationType = 'voice';
      } else if (donation.hypersound_url) {
        donationType = 'hypersound';
      }

      // Prepare alert data
      const alertData = {
        id: donation.id,
        name: donation.name,
        amount: donation.amount,
        currency: donation.currency || 'INR',
        message: donation.message,
        type: donationType,
        voice_message_url: donation.voice_message_url,
        tts_audio_url: donation.tts_audio_url,
        hypersound_url: donation.hypersound_url,
        is_hyperemote: donation.is_hyperemote,
        selected_gif_id: donation.selected_gif_id,
        message_visible: donation.message_visible !== false,
        created_at: donation.created_at,
        media_url: donation.media_url,
        media_type: donation.media_type
      };

      // Silent audio URL for text donations under ₹70 (triggers visual alert without TTS)
      const SILENT_AUDIO_URL = Deno.env.get('SILENT_AUDIO_URL') || 'https://pub-fff13c27bb0d4a1e807dfc596462b7d5.r2.dev/silent.mp3';

      // Generate TTS if needed
      // Text donation >= ₹70: generates TTS (with message or "Thank you!" fallback)
      // Media donation: always generate announcement
      const shouldGenerateTextTTS = donationType === 'text' && 
        donation.amount >= 70 && 
        !donation.tts_audio_url &&
        streamer.tts_enabled !== false;
      // REMOVED: donation.message requirement - generate-donation-tts has "Thank you!" fallback

      const shouldGenerateMediaTTS = donationType === 'media' && 
        !donation.tts_audio_url &&
        streamer.tts_enabled !== false;

      // Text donations < ₹70 get silent audio (triggers visual alert without TTS cost)
      const shouldUseSilentAudio = donationType === 'text' && 
        !donation.tts_audio_url &&
        donation.amount < 70;

      const shouldGenerateTTS = shouldGenerateTextTTS || shouldGenerateMediaTTS;

      if (shouldGenerateTTS) {
        console.log(`Generating TTS for manually approved ${donationType} donation...`);
        try {
          const ttsResponse = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-donation-tts`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
              },
              body: JSON.stringify({
                donationId: donation.id,
                streamerId: streamerId,
                tableName: donationTable,
                username: donation.name,
                amount: donation.amount,
                message: donationType === 'text' ? donation.message : null,
                currency: donation.currency || 'INR',
                isMediaAnnouncement: donationType === 'media',
                mediaType: donation.media_type,
                voiceId: streamer.tts_voice_id || 'en-IN-Standard-B'
              })
            }
          );

          if (ttsResponse.ok) {
            const ttsResult = await ttsResponse.json();
            if (ttsResult.audioUrl) {
              alertData.tts_audio_url = ttsResult.audioUrl;
              console.log('TTS generated successfully:', ttsResult.audioUrl);
            }
          } else {
            console.error('TTS generation failed:', await ttsResponse.text());
          }
        } catch (ttsError) {
          console.error('Error calling TTS function:', ttsError);
        }
      } else if (shouldUseSilentAudio) {
        // Use silent audio for text donations under ₹70 - triggers visual alert without TTS
        alertData.tts_audio_url = SILENT_AUDIO_URL;
        console.log('Using silent audio for donation under ₹70 threshold');
        
        // Update database with silent audio URL
        await supabaseAdmin
          .from(donationTable)
          .update({ tts_audio_url: SILENT_AUDIO_URL })
          .eq('id', donationId);
      }

      // Send Pusher event to OBS alerts channel (for new-donation tracking only)
      // Note: audio-now-playing is ONLY sent by get-current-audio when audio actually plays
      console.log(`Sending Pusher event to ${channelSlug}-alerts channel`);
      await sendPusherEvent(
        [`${channelSlug}-alerts`],
        'new-donation',
        alertData,
        pusherGroup
      );

      // Also send to audio player channel for media source
      console.log(`Sending Pusher event to ${channelSlug}-audio channel`);
      await sendPusherEvent(
        [`${channelSlug}-audio`],
        'new-audio-message',
        alertData,
        pusherGroup
      );

      // Also send to dashboard for real-time updates
      // Use 'donation-approved' for leaderboard hook compatibility when approving
      await sendPusherEvent(
        [`${channelSlug}-dashboard`],
        action === 'approve' ? 'donation-approved' : 'donation-updated',
        { ...alertData, action },
        pusherGroup
      );

      // Calculate and send leaderboard update when approving (reduces egress vs full table scan on client)
      if (action === 'approve') {
        try {
          const EXCHANGE_RATES_TO_INR: Record<string, number> = {
            'INR': 1, 'USD': 89, 'EUR': 94, 'GBP': 113, 'AED': 24, 'AUD': 57
          };
          
          const { data: allDonations } = await supabaseAdmin
            .from(donationTable)
            .select('name, amount, currency')
            .eq('payment_status', 'success')
            .in('moderation_status', ['auto_approved', 'approved']);
          
          if (allDonations && allDonations.length > 0) {
            const donatorTotals: Record<string, { name: string; totalAmount: number }> = {};
            allDonations.forEach((d: any) => {
              const key = d.name.toLowerCase();
              const amountInINR = (d.amount || 0) * (EXCHANGE_RATES_TO_INR[d.currency || 'INR'] || 1);
              if (!donatorTotals[key]) {
                donatorTotals[key] = { name: d.name, totalAmount: 0 };
              }
              donatorTotals[key].totalAmount += amountInINR;
            });
            
            const sortedDonators = Object.values(donatorTotals)
              .sort((a, b) => b.totalAmount - a.totalAmount);
            
            await sendPusherEvent([`${channelSlug}-dashboard`], 'leaderboard-updated', {
              topDonator: sortedDonators[0] || null,
              latestDonation: {
                name: donation.name,
                amount: donation.amount,
                currency: donation.currency || 'INR',
                created_at: donation.created_at,
              }
            }, pusherGroup);
            console.log(`Leaderboard update sent for ${channelSlug}`);
          }
        } catch (leaderboardError) {
          console.error('Error calculating leaderboard:', leaderboardError);
        }
      }

      // NOTE: Goal progress is NOT updated here - it's already updated on payment success
      // in razorpay-webhook and check-payment-status functions. Goals should reflect
      // money received (payment success), not moderation status.
    }

    // Send Telegram notification about the moderation action to all moderators
    if ((action === 'approve' || action === 'reject') && streamer) {
      try {
        const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
        if (telegramBotToken && streamer.telegram_moderation_enabled) {
          // Fetch all active moderators for this streamer
          const { data: moderators } = await supabaseAdmin
            .from('streamers_moderators')
            .select('telegram_user_id, mod_name')
            .eq('streamer_id', streamerId)
            .eq('is_active', true);

          if (moderators && moderators.length > 0) {
            const actionEmoji = action === 'approve' ? '✅' : '❌';
            const actionText = action === 'approve' ? 'Approved' : 'Rejected';
            const moderatorInfo = moderatorName || 'Dashboard';
            
            const messageText = 
              `${actionEmoji} <b>Donation ${actionText}</b>\n\n` +
              `💰 ₹${donation.amount} from ${donation.name}\n` +
              `👤 By: ${moderatorInfo}\n` +
              `📱 Via: ${source === 'telegram' ? 'Telegram' : 'Dashboard'}`;

            for (const mod of moderators) {
              try {
                console.log(`Sending Telegram approval notification to ${mod.mod_name} (${mod.telegram_user_id})...`);
                
                const telegramResponse = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: mod.telegram_user_id,
                    text: messageText,
                    parse_mode: 'HTML'
                  })
                });
                
                const responseData = await telegramResponse.json();
                
                if (!responseData.ok) {
                  console.error(`Telegram API error for ${mod.mod_name}:`, responseData.error_code, responseData.description);
                } else {
                  console.log(`Successfully sent approval notification to ${mod.mod_name}`);
                }
              } catch (modError) {
                console.error(`Failed to notify moderator ${mod.mod_name}:`, modError);
              }
            }
            console.log(`Telegram notification attempts completed for ${moderators.length} moderators`);
          }
        }
      } catch (telegramError) {
        console.error('Error sending Telegram notifications:', telegramError);
      }
    }

    // Log the moderation action
    const { data: actionLog, error: logError } = await supabaseAdmin
      .from('moderation_actions')
      .insert({
        streamer_id: streamerId,
        moderator_id: moderatorId,
        moderator_telegram_id: moderatorTelegramId,
        moderator_name: moderatorName,
        donation_id: donationId,
        donation_table: donationTable,
        action_type: action,
        action_source: source,
        previous_status: previousStatus,
        new_status: newStatus,
        notes: notes
      })
      .select('id')
      .single();

    if (logError) {
      console.error('Error logging action:', logError);
    }

    // Update moderator stats
    if (moderatorId) {
      await supabaseAdmin
        .from('streamers_moderators')
        .update({ 
          last_action_at: new Date().toISOString(),
          total_actions: supabaseAdmin.rpc('increment_total_actions', { mod_id: moderatorId })
        })
        .eq('id', moderatorId);
    }

    console.log(`Moderation action ${action} completed for donation ${donationId}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      donationId,
      previousStatus,
      newStatus,
      actionLogId: actionLog?.id,
      alertSent: shouldSendOBSAlert
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in moderate-donation:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function checkPermission(moderator: any, action: string): boolean {
  // Owner has all permissions
  if (moderator.role === 'owner') return true;
  
  // Viewer has no action permissions
  if (moderator.role === 'viewer') return false;
  
  // Check specific permissions for moderator role
  switch (action) {
    case 'approve':
      return moderator.can_approve;
    case 'reject':
      return moderator.can_reject;
    case 'hide_message':
    case 'unhide_message':
      return moderator.can_hide_message;
    case 'ban_donor':
    case 'unban_donor':
      return moderator.can_ban;
    case 'replay':
      return moderator.can_replay;
    default:
      return false;
  }
}
