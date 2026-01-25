// Updated: 2026-01-25 - Cleaned up legacy streamers, only active: Ankit, Chiaa Gaming, Looteriya Gaming
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHash, createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
}

// Exchange rates to INR for TTS threshold conversion
const EXCHANGE_RATES_TO_INR: Record<string, number> = {
  'INR': 1, 'USD': 89, 'EUR': 94, 'GBP': 113, 'AED': 24, 'AUD': 57
};

const convertToINR = (amount: number, currency: string): number => {
  return amount * (EXCHANGE_RATES_TO_INR[currency] || 1);
};

// Mapping from streamerType to correct streamer_slug (for database lookup)
const streamerSlugMap: Record<string, string> = {
  'looteriyagaming': 'looteriya_gaming',
  'chiagaming': 'chiaa_gaming',
};

// Generate short ID for callback mapping (8 characters)
function generateShortId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create callback mapping and return short callback_data
async function createCallbackMapping(
  supabase: any,
  donationId: string,
  tableName: string,
  streamerId: string,
  action: string
): Promise<string> {
  const shortId = generateShortId();
  
  try {
    const { error } = await supabase
      .from('telegram_callback_mapping')
      .insert({
        short_id: shortId,
        donation_id: donationId,
        table_name: tableName,
        streamer_id: streamerId,
        action_type: action,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });
    
    if (error) {
      console.error('Error creating callback mapping:', error);
      // Fallback to truncated format if mapping fails
      return `${action.charAt(0)}_${donationId.substring(0, 8)}`;
    }
    
    // Return shortened format: action_prefix + short_id (max ~11 chars)
    const actionPrefix = {
      'approve': 'a',
      'reject': 'r', 
      'hide_message': 'h',
      'ban_donor': 'b',
      'replay': 'p'
    }[action] || action.charAt(0);
    
    return `${actionPrefix}_${shortId}`;
  } catch (err) {
    console.error('Error in createCallbackMapping:', err);
    return `${action.charAt(0)}_${donationId.substring(0, 8)}`;
  }
}

// Helper function to get Pusher credentials based on streamer_slug
async function getPusherCredentials(streamerSlug: string, supabase: any) {
  try {
    const { data: streamer, error } = await supabase
      .from('streamers')
      .select('pusher_group, streamer_name')
      .eq('streamer_slug', streamerSlug)
      .single();

    if (error || !streamer) {
      console.error(`[Pusher] Failed to fetch pusher_group for ${streamerSlug}:`, error);
      return {
        appId: Deno.env.get('PUSHER_APP_ID_1') || Deno.env.get('PUSHER_APP_ID'),
        key: Deno.env.get('PUSHER_KEY_1') || Deno.env.get('PUSHER_KEY'),
        secret: Deno.env.get('PUSHER_SECRET_1') || Deno.env.get('PUSHER_SECRET'),
        cluster: Deno.env.get('PUSHER_CLUSTER_1') || Deno.env.get('PUSHER_CLUSTER'),
        group: 1
      };
    }

    const group = streamer.pusher_group || 1;
    
    const credentials = {
      appId: Deno.env.get(`PUSHER_APP_ID_${group}`),
      key: Deno.env.get(`PUSHER_KEY_${group}`),
      secret: Deno.env.get(`PUSHER_SECRET_${group}`),
      cluster: Deno.env.get(`PUSHER_CLUSTER_${group}`),
      group
    };

    console.log(`[Pusher] Using Group ${group} credentials for ${streamerSlug}`);
    return credentials;
  } catch (err) {
    console.error('[Pusher] Error fetching credentials:', err);
    return {
      appId: Deno.env.get('PUSHER_APP_ID_1') || Deno.env.get('PUSHER_APP_ID'),
      key: Deno.env.get('PUSHER_KEY_1') || Deno.env.get('PUSHER_KEY'),
      secret: Deno.env.get('PUSHER_SECRET_1') || Deno.env.get('PUSHER_SECRET'),
      cluster: Deno.env.get('PUSHER_CLUSTER_1') || Deno.env.get('PUSHER_CLUSTER'),
      group: 1
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const webhookSecret = Deno.env.get('razorpay-webhook-secret')
    const webhookSignature = req.headers.get('x-razorpay-signature')
    const webhookBody = await req.text()

    console.log('Razorpay webhook received')

    // SECURITY: Verify webhook signature - reject if secret or signature is missing
    if (!webhookSecret) {
      console.error('SECURITY: Webhook secret not configured - rejecting request')
      return new Response('Unauthorized - webhook secret not configured', { status: 401, headers: corsHeaders })
    }

    if (!webhookSignature) {
      console.error('SECURITY: No signature in webhook request - rejecting request')
      return new Response('Unauthorized - missing signature', { status: 401, headers: corsHeaders })
    }

    const expectedSignature = createHmac('sha256', webhookSecret)
      .update(webhookBody)
      .digest('hex')

    if (webhookSignature !== expectedSignature) {
      console.error('SECURITY: Invalid webhook signature - rejecting request')
      return new Response('Unauthorized - invalid signature', { status: 401, headers: corsHeaders })
    }
    
    console.log('Webhook signature verified ✓')

    // Parse webhook data
    const webhookData = JSON.parse(webhookBody)
    const event = webhookData.event
    
    console.log('Webhook event:', event)

    // Only process payment.captured and payment.failed events
    if (event !== 'payment.captured' && event !== 'payment.failed') {
      console.log('Ignoring event:', event)
      return new Response('Event ignored', { status: 200, headers: corsHeaders })
    }

    // Extract Razorpay order ID and currency from payment entity
    const razorpayOrderId = webhookData.payload?.payment?.entity?.order_id
    const paymentCurrency = webhookData.payload?.payment?.entity?.currency || 'INR'
    
    console.log('Razorpay Order ID:', razorpayOrderId, 'Currency:', paymentCurrency)
    
    if (!razorpayOrderId) {
      console.log('No Razorpay order ID found, ignoring')
      return new Response('No order ID', { status: 400, headers: corsHeaders })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Determine table based on order ID - only active streamers
    let streamerType: 'ankit' | 'looteriyagaming' | 'chiagaming'
    let tableName: string
    
    // Get donation from the appropriate table using Razorpay order ID
    let donation: any
    let fetchError: any
    
    // Try ankit first
    const ankitResult = await supabase
      .from('ankit_donations')
      .select('*')
      .eq('razorpay_order_id', razorpayOrderId)
      .maybeSingle()
    
    if (ankitResult.data) {
      donation = ankitResult.data
      streamerType = 'ankit'
      tableName = 'ankit_donations'
    } else {
      // Try looteriya_gaming
      const looteriyaGamingResult = await supabase
        .from('looteriya_gaming_donations')
        .select('*')
        .eq('razorpay_order_id', razorpayOrderId)
        .maybeSingle()
      
      if (looteriyaGamingResult.data) {
        donation = looteriyaGamingResult.data
        streamerType = 'looteriyagaming'
        tableName = 'looteriya_gaming_donations'
      } else {
        // Try chiaa_gaming
        const chiagamingResult = await supabase
          .from('chiaa_gaming_donations')
          .select('*')
          .eq('razorpay_order_id', razorpayOrderId)
          .maybeSingle()
        
        if (chiagamingResult.data) {
          donation = chiagamingResult.data
          streamerType = 'chiagaming'
          tableName = 'chiaa_gaming_donations'
        } else {
          fetchError = ankitResult.error || looteriyaGamingResult.error || chiagamingResult.error
        }
      }
    }

    if (fetchError || !donation) {
      console.error('Donation not found for Razorpay order:', razorpayOrderId)
      return new Response('Donation not found', { status: 404, headers: corsHeaders })
    }
    
    console.log('Found donation:', donation.order_id)

    // Check if already processed
    if (donation.payment_status === 'success') {
      console.log('Payment already processed:', donation.order_id)
      return new Response('Already processed', { status: 200, headers: corsHeaders })
    }

    const isSuccess = event === 'payment.captured'
    const newStatus = isSuccess ? 'success' : 'failed'

    console.log('Updating payment status to:', newStatus)

    // Calculate audio_scheduled_at based on donation type
    const audioDelay = donation.hypersound_url ? 15000 : 60000;
    const audioScheduledAt = new Date(Date.now() + audioDelay).toISOString();

    // Fetch streamer's moderation settings
    const { data: streamerSettings, error: streamerError } = await supabase
      .from('streamers')
      .select('moderation_mode, telegram_moderation_enabled, media_moderation_enabled')
      .eq('id', donation.streamer_id)
      .single();

    if (streamerError) {
      console.error('Error fetching streamer settings:', streamerError);
    }

    const moderationMode = streamerSettings?.moderation_mode || 'auto_approve';
    // HyperSounds/HyperEmotes always auto-approve (no user content to moderate)
    const isHypersound = donation.hypersound_url || donation.is_hyperemote;
    // Check if this is a media donation that requires moderation
    const hasMedia = donation.media_url && donation.media_url.length > 0;
    const mediaRequiresModeration = hasMedia && streamerSettings?.media_moderation_enabled;
    
    // HyperSounds always bypass moderation, media goes to moderation if enabled
    const shouldAutoApprove = isHypersound || 
      (moderationMode === 'auto_approve' && !mediaRequiresModeration);
    
    // Determine the moderation status
    let moderationStatus = 'pending';
    if (shouldAutoApprove) {
      moderationStatus = 'auto_approved';
    } else if (mediaRequiresModeration) {
      moderationStatus = 'pending'; // Media donations go to moderation queue
    }

    console.log('Moderation decision:', {
      moderationMode,
      isHypersound,
      hasMedia,
      mediaRequiresModeration,
      shouldAutoApprove,
      moderationStatus
    });

    // Update donation with payment status and moderation status
    const updateData: any = {
      payment_status: newStatus,
      moderation_status: isSuccess ? moderationStatus : 'rejected'
    };
    
    // Only set audio_scheduled_at for auto-approved donations
    if (isSuccess && shouldAutoApprove) {
      updateData.audio_scheduled_at = audioScheduledAt;
    }

    const { error: updateError } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', donation.id)

    if (updateError) {
      console.error('Error updating donation:', updateError)
      throw updateError
    }

    console.log('Donation updated successfully')

    // If payment successful, trigger TTS/audio and send Pusher events
    if (isSuccess) {
      // Determine the correct streamer_slug for Pusher channel
      const streamerSlug = streamerSlugMap[streamerType] || streamerType;
      
      // Get Pusher credentials for this streamer
      const pusherCredentials = await getPusherCredentials(streamerSlug, supabase);
      
      if (!pusherCredentials.appId || !pusherCredentials.key || !pusherCredentials.secret || !pusherCredentials.cluster) {
        console.error('Missing Pusher credentials for streamer:', streamerSlug);
      } else {
        // Build Pusher auth signature
        const timestamp = Math.floor(Date.now() / 1000).toString();
        
        // Helper function to create Pusher event
        const sendPusherEvent = async (channel: string, eventName: string, eventData: any) => {
          const body = JSON.stringify({
            name: eventName,
            channel: channel,
            data: JSON.stringify(eventData)
          });
          
          const bodyMd5 = createHash('md5').update(body).digest('hex');
          const stringToSign = `POST\n/apps/${pusherCredentials.appId}/events\nauth_key=${pusherCredentials.key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${bodyMd5}`;
          const signature = createHmac('sha256', pusherCredentials.secret!).update(stringToSign).digest('hex');
          
          const pusherUrl = `https://api-${pusherCredentials.cluster}.pusher.com/apps/${pusherCredentials.appId}/events?auth_key=${pusherCredentials.key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${bodyMd5}&auth_signature=${signature}`;
          
          const response = await fetch(pusherUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Pusher ${eventName} failed:`, errorText);
          } else {
            console.log(`Pusher ${eventName} sent successfully to ${channel}`);
          }
        };

        // Send dashboard notification for all successful payments
        const dashboardChannel = `${streamerSlug.replace(/_/g, '-')}-dashboard`;
        await sendPusherEvent(dashboardChannel, 'new-donation', {
          id: donation.id,
          name: donation.name,
          amount: donation.amount,
          message: donation.message,
          currency: paymentCurrency,
          created_at: donation.created_at,
          payment_status: 'success',
          moderation_status: moderationStatus,
          voice_message_url: donation.voice_message_url,
          hypersound_url: donation.hypersound_url,
          is_hyperemote: donation.is_hyperemote,
          media_url: donation.media_url,
          media_type: donation.media_type
        });

        // Only send audio queue events for auto-approved donations
        if (shouldAutoApprove) {
          // Generate TTS if needed (for text donations without voice/hypersound)
          if (!donation.voice_message_url && !donation.hypersound_url) {
            try {
              console.log('Generating TTS for donation:', donation.id);
              const ttsResponse = await supabase.functions.invoke('generate-donation-tts', {
                body: {
                  username: donation.name,
                  amount: donation.amount,
                  message: donation.message,
                  donationId: donation.id,
                  streamerId: donation.streamer_id,
                  isVoiceAnnouncement: false,
                  isMediaAnnouncement: hasMedia,
                  mediaType: donation.media_type,
                  currency: paymentCurrency
                }
              });
              
              if (ttsResponse.error) {
                console.error('TTS generation failed:', ttsResponse.error);
              } else {
                console.log('TTS generated successfully:', ttsResponse.data?.audioUrl);
              }
            } catch (ttsError) {
              console.error('TTS generation error:', ttsError);
            }
          }

          // Refetch donation to get updated TTS URL
          const { data: updatedDonation } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', donation.id)
            .single();

          // Send audio queue event
          const audioChannel = `${streamerSlug.replace(/_/g, '-')}-audio`;
          await sendPusherEvent(audioChannel, 'new-audio-message', {
            id: updatedDonation?.id || donation.id,
            name: updatedDonation?.name || donation.name,
            amount: updatedDonation?.amount || donation.amount,
            message: updatedDonation?.message || donation.message,
            currency: paymentCurrency,
            created_at: updatedDonation?.created_at || donation.created_at,
            payment_status: 'success',
            moderation_status: 'auto_approved',
            voice_message_url: updatedDonation?.voice_message_url || donation.voice_message_url,
            tts_audio_url: updatedDonation?.tts_audio_url,
            hypersound_url: updatedDonation?.hypersound_url || donation.hypersound_url,
            is_hyperemote: updatedDonation?.is_hyperemote || donation.is_hyperemote,
            media_url: updatedDonation?.media_url || donation.media_url,
            media_type: updatedDonation?.media_type || donation.media_type,
            audio_scheduled_at: audioScheduledAt
          });
        }

        // Send Telegram notification if moderation is enabled
        if (streamerSettings?.telegram_moderation_enabled && !shouldAutoApprove) {
          try {
            // Create shortened callback mappings for each action
            const approveCallback = await createCallbackMapping(supabase, donation.id, tableName, donation.streamer_id, 'approve');
            const rejectCallback = await createCallbackMapping(supabase, donation.id, tableName, donation.streamer_id, 'reject');
            const hideCallback = await createCallbackMapping(supabase, donation.id, tableName, donation.streamer_id, 'hide_message');
            const banCallback = await createCallbackMapping(supabase, donation.id, tableName, donation.streamer_id, 'ban_donor');

            // Call notify-new-donations edge function
            const { error: notifyError } = await supabase.functions.invoke('notify-new-donations', {
              body: {
                donation: {
                  id: donation.id,
                  name: donation.name,
                  amount: donation.amount,
                  message: donation.message,
                  currency: paymentCurrency,
                  voice_message_url: donation.voice_message_url,
                  media_url: donation.media_url,
                  media_type: donation.media_type
                },
                streamer_id: donation.streamer_id,
                table_name: tableName,
                callback_data: {
                  approve: approveCallback,
                  reject: rejectCallback,
                  hide_message: hideCallback,
                  ban_donor: banCallback
                }
              }
            });

            if (notifyError) {
              console.error('Failed to send Telegram notification:', notifyError);
            } else {
              console.log('Telegram notification sent successfully');
            }
          } catch (telegramError) {
            console.error('Telegram notification error:', telegramError);
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
