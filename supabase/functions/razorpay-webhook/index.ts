// Updated: 2026-01-16 - Production moderation system with shortened callback data
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
  'damaskplays': 'damask_plays',
  'nekoxenpai': 'neko_xenpai',
  'jimmygaming': 'jimmy_gaming',
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

    // Determine table based on order ID prefix (supports both old and new formats)
    let streamerType: 'ankit' | 'thunderx' | 'vipbhai' | 'sagarujjwalgaming' | 'notyourkween' | 'bongflick' | 'mriqmaster' | 'abdevil' | 'looteriyagaming' | 'damaskplays' | 'nekoxenpai' | 'jhanvoo' | 'clumsygod' | 'jimmygaming' | 'chiagaming'
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
      // Try thunderx
      const thunderxResult = await supabase
        .from('thunderx_donations')
        .select('*')
        .eq('razorpay_order_id', razorpayOrderId)
        .maybeSingle()
      
      if (thunderxResult.data) {
        donation = thunderxResult.data
        streamerType = 'thunderx'
        tableName = 'thunderx_donations'
      } else {
        // Try vipbhai
        const vipbhaiResult = await supabase
          .from('vipbhai_donations')
          .select('*')
          .eq('razorpay_order_id', razorpayOrderId)
          .maybeSingle()
        
        if (vipbhaiResult.data) {
          donation = vipbhaiResult.data
          streamerType = 'vipbhai'
          tableName = 'vipbhai_donations'
        } else {
          // Try sagarujjwalgaming
          const sagarujjwalgamingResult = await supabase
            .from('sagarujjwalgaming_donations')
            .select('*')
            .eq('razorpay_order_id', razorpayOrderId)
            .maybeSingle()
          
          if (sagarujjwalgamingResult.data) {
            donation = sagarujjwalgamingResult.data
            streamerType = 'sagarujjwalgaming'
            tableName = 'sagarujjwalgaming_donations'
          } else {
            // Try notyourkween
            const notyourkweenResult = await supabase
              .from('notyourkween_donations')
              .select('*')
              .eq('razorpay_order_id', razorpayOrderId)
              .maybeSingle()
            
            if (notyourkweenResult.data) {
              donation = notyourkweenResult.data
              streamerType = 'notyourkween'
              tableName = 'notyourkween_donations'
            } else {
              // Try bongflick
              const bongflickResult = await supabase
                .from('bongflick_donations')
                .select('*')
                .eq('razorpay_order_id', razorpayOrderId)
                .maybeSingle()
              
              if (bongflickResult.data) {
                donation = bongflickResult.data
                streamerType = 'bongflick'
                tableName = 'bongflick_donations'
              } else {
                // Try mriqmaster
                const mriqmasterResult = await supabase
                  .from('mriqmaster_donations')
                  .select('*')
                  .eq('razorpay_order_id', razorpayOrderId)
                  .maybeSingle()
                
                if (mriqmasterResult.data) {
                  donation = mriqmasterResult.data
                  streamerType = 'mriqmaster'
                  tableName = 'mriqmaster_donations'
                } else {
                  // Try abdevil
                  const abdevilResult = await supabase
                    .from('abdevil_donations')
                    .select('*')
                    .eq('razorpay_order_id', razorpayOrderId)
                    .maybeSingle()
                  
                  if (abdevilResult.data) {
                    donation = abdevilResult.data
                    streamerType = 'abdevil'
                    tableName = 'abdevil_donations'
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
                      // Try damask_plays
                      const damaskPlaysResult = await supabase
                        .from('damask_plays_donations')
                        .select('*')
                        .eq('razorpay_order_id', razorpayOrderId)
                        .maybeSingle()
                      
                      if (damaskPlaysResult.data) {
                        donation = damaskPlaysResult.data
                        streamerType = 'damaskplays'
                        tableName = 'damask_plays_donations'
                      } else {
                        // Try neko_xenpai
                        const nekoXenpaiResult = await supabase
                          .from('neko_xenpai_donations')
                          .select('*')
                          .eq('razorpay_order_id', razorpayOrderId)
                          .maybeSingle()
                        
                        if (nekoXenpaiResult.data) {
                          donation = nekoXenpaiResult.data
                          streamerType = 'nekoxenpai'
                          tableName = 'neko_xenpai_donations'
                        } else {
                          // Try jhanvoo
                          const jhanvooResult = await supabase
                            .from('jhanvoo_donations')
                            .select('*')
                            .eq('razorpay_order_id', razorpayOrderId)
                            .maybeSingle()
                          
                          if (jhanvooResult.data) {
                            donation = jhanvooResult.data
                            streamerType = 'jhanvoo'
                            tableName = 'jhanvoo_donations'
                          } else {
                            // Try clumsygod
                            const clumsygodResult = await supabase
                              .from('clumsygod_donations')
                              .select('*')
                              .eq('razorpay_order_id', razorpayOrderId)
                              .maybeSingle()
                            
                            if (clumsygodResult.data) {
                              donation = clumsygodResult.data
                              streamerType = 'clumsygod'
                              tableName = 'clumsygod_donations'
                            } else {
                            // Try jimmy_gaming
                              const jimmyGamingResult = await supabase
                                .from('jimmy_gaming_donations')
                                .select('*')
                                .eq('razorpay_order_id', razorpayOrderId)
                                .maybeSingle()
                              
                              if (jimmyGamingResult.data) {
                                donation = jimmyGamingResult.data
                                streamerType = 'jimmygaming'
                                tableName = 'jimmy_gaming_donations'
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
                                  fetchError = ankitResult.error || thunderxResult.error || vipbhaiResult.error || sagarujjwalgamingResult.error || notyourkweenResult.error || bongflickResult.error || mriqmasterResult.error || abdevilResult.error || looteriyaGamingResult.error || damaskPlaysResult.error || nekoXenpaiResult.error || jhanvooResult.error || clumsygodResult.error || jimmyGamingResult.error || chiagamingResult.error
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
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
    const moderationStatus = shouldAutoApprove ? 'auto_approved' : 'pending';
    
    if (isHypersound) {
      console.log('HyperSound/HyperEmote detected - bypassing moderation');
    }
    if (mediaRequiresModeration) {
      console.log('Media donation detected with moderation enabled - sending to moderation queue');
    }
    console.log(`Streamer moderation_mode: ${moderationMode}, isHypersound: ${isHypersound}, hasMedia: ${hasMedia}, mediaRequiresModeration: ${mediaRequiresModeration}, shouldAutoApprove: ${shouldAutoApprove}`);

    // Update donation status
    const updateData: any = {
      payment_status: newStatus,
      moderation_status: isSuccess ? moderationStatus : undefined,
      approved_at: isSuccess && shouldAutoApprove ? new Date().toISOString() : null,
      approved_by: isSuccess && shouldAutoApprove ? 'system' : null,
      updated_at: new Date().toISOString(),
      audio_scheduled_at: isSuccess && shouldAutoApprove ? audioScheduledAt : null
    }

    console.log(`Setting audio_scheduled_at to ${audioScheduledAt} (${audioDelay/1000}s delay for ${donation.hypersound_url ? 'HyperSound' : 'regular'})`)

    const { error: updateError } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('razorpay_order_id', razorpayOrderId)

    if (updateError) {
      console.error('Failed to update donation:', updateError)
      throw updateError
    }

    console.log('Donation updated successfully')

    // Only trigger events and TTS for successful payments
    if (isSuccess) {
      // Get group-specific Pusher credentials based on streamer
      const pusherSlug = streamerSlugMap[streamerType] || streamerType;
      const pusherCreds = await getPusherCredentials(pusherSlug, supabase);
      const pusherAppId = pusherCreds.appId!
      const pusherKey = pusherCreds.key!
      const pusherSecret = pusherCreds.secret!
      const pusherCluster = pusherCreds.cluster!
      const pusherUrl = `https://api-${pusherCluster}.pusher.com/apps/${pusherAppId}/events`

      // Helper function to send Pusher events
      const sendPusherEvent = async (channels: string[], eventName: string, data: any) => {
        const pusherPayload = {
          name: eventName,
          channels,
          data: JSON.stringify(data)
        }
        
        const timestamp = Math.floor(Date.now() / 1000)
        const pusherBody = JSON.stringify(pusherPayload)
        const md5 = createHash('md5').update(pusherBody).digest('hex')
        const stringToSign = `POST\n/apps/${pusherAppId}/events\nauth_key=${pusherKey}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${md5}`
        const signature = createHmac('sha256', pusherSecret).update(stringToSign).digest('hex')
        const pusherAuthUrl = `${pusherUrl}?auth_key=${pusherKey}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${md5}&auth_signature=${signature}`

        try {
          const response = await fetch(pusherAuthUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: pusherBody
          })
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error(`Pusher error for ${eventName}:`, errorText)
          } else {
            console.log(`Pusher event ${eventName} sent successfully to channels:`, channels)
          }
        } catch (error) {
          console.error(`Failed to send Pusher event ${eventName}:`, error)
        }
      }

      // Determine donation type
      let donationType: 'text' | 'voice' | 'hypersound' | 'media' = 'text';
      if (donation.voice_message_url) {
        donationType = 'voice';
      } else if (donation.hypersound_url) {
        donationType = 'hypersound';
      } else if (donation.media_url) {
        donationType = 'media';
      }
      
      // Silent audio URL for text donations under ₹70 (triggers visual alert without TTS)
      const SILENT_AUDIO_URL = Deno.env.get('SILENT_AUDIO_URL') || 'https://pub-fff13c27bb0d4a1e807dfc596462b7d5.r2.dev/silent.mp3';
      
      // TTS generation for text donations with significant amount OR media donations (only for auto-approved)
      const amountInINR = convertToINR(Number(donation.amount), paymentCurrency);
      const shouldGenerateTTS = shouldAutoApprove && 
        ((donationType === 'text' && donation.message && amountInINR >= 70) ||
         donationType === 'media');
      // Text donations < ₹70 OR without message get silent audio (triggers visual alert without TTS cost)
      const shouldUseSilentAudio = shouldAutoApprove && 
        donationType === 'text' && 
        (amountInINR < 70 || !donation.message);

      if (shouldGenerateTTS) {
        console.log('Generating TTS for donation...')
        try {
          const { data: streamer } = await supabase
            .from('streamers')
            .select('tts_voice_id, tts_enabled')
            .eq('id', donation.streamer_id)
            .single();
          
          if (streamer?.tts_enabled !== false) {
            const ttsResponse = await fetch(
              `${supabaseUrl}/functions/v1/generate-donation-tts`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`
                },
                body: JSON.stringify({
                  donationId: donation.id,
                  streamerId: donation.streamer_id,
                  tableName: tableName,
                  username: donation.name,
                  amount: donation.amount,
                  message: donationType === 'text' ? donation.message : null,
                  currency: paymentCurrency,
                  isMediaAnnouncement: donationType === 'media',
                  mediaType: donation.media_type,
                  voiceId: streamer?.tts_voice_id || 'en-IN-Standard-B'
                })
              }
            )
            
            if (ttsResponse.ok) {
              const ttsResult = await ttsResponse.json()
              if (ttsResult.audioUrl) {
                donation.tts_audio_url = ttsResult.audioUrl
                console.log('TTS generated:', ttsResult.audioUrl)
              }
            } else {
              console.error('TTS generation failed:', await ttsResponse.text())
            }
          }
        } catch (ttsError) {
          console.error('TTS generation error:', ttsError)
        }
      } else if (shouldUseSilentAudio) {
        // Use silent audio for text donations under ₹70 - triggers visual alert without TTS
        donation.tts_audio_url = SILENT_AUDIO_URL;
        console.log('Using silent audio for donation under ₹70 threshold');
        
        // Update database with silent audio URL
        await supabase
          .from(tableName)
          .update({ tts_audio_url: SILENT_AUDIO_URL })
          .eq('id', donation.id);
      }

      // Prepare donation data for events
      const donationData = {
        id: donation.id,
        name: donation.name,
        amount: donation.amount,
        currency: paymentCurrency,
        message: donation.message,
        voice_message_url: donation.voice_message_url,
        tts_audio_url: donation.tts_audio_url,
        hypersound_url: donation.hypersound_url,
        is_hyperemote: donation.is_hyperemote,
        selected_gif_id: donation.selected_gif_id,
        message_visible: true,
        created_at: donation.created_at,
        type: donationType,
        media_url: donation.media_url,
        media_type: donation.media_type
      }

      // For auto-approved donations: Do NOT send immediate alerts to OBS
      // The visual alert + audio will be triggered by get-current-audio after the delay
      // This ensures the 60-second fraud protection delay is enforced
      if (shouldAutoApprove) {
        // Only send to audio channel to notify MediaSource polling (optional, for faster detection)
        console.log(`Auto-approved donation - audio scheduled in ${audioDelay/1000}s, NOT sending immediate OBS alert`)
        await sendPusherEvent([`${pusherSlug}-audio`], 'new-audio-message', donationData)
      }

      // Send goal progress update for ALL successful payments (regardless of moderation status)
      // Goal updates should happen immediately when payment succeeds, not on approval
      try {
        const { data: streamerGoal, error: goalError } = await supabase
          .from('streamers')
          .select('goal_is_active, goal_activated_at, goal_target_amount')
          .eq('id', donation.streamer_id)
          .single();

        if (!goalError && streamerGoal?.goal_is_active && streamerGoal.goal_activated_at) {
          const { data: goalDonations, error: donError } = await supabase
            .from(tableName)
            .select('amount, currency')
            .eq('streamer_id', donation.streamer_id)
            .eq('payment_status', 'success')
            .gte('created_at', streamerGoal.goal_activated_at);

          if (!donError && goalDonations) {
            const newTotal = goalDonations.reduce((sum: number, d: any) => {
              const currency = d.currency || 'INR';
              const rate = EXCHANGE_RATES_TO_INR[currency] || 1;
              return sum + Number(d.amount) * rate;
            }, 0);
            
            await sendPusherEvent([`${pusherSlug}-goal`], 'goal-progress', {
              currentAmount: newTotal,
              targetAmount: streamerGoal.goal_target_amount,
            });

            console.log(`Goal progress update sent for ${pusherSlug}:`, newTotal);
          }
        }
      } catch (goalError) {
        console.error('Error sending goal progress update:', goalError);
      }

      // Send dashboard update event (always, regardless of moderation status)
      // Use 'new-donation' for leaderboard hook compatibility
      await sendPusherEvent([`${pusherSlug}-dashboard`], 'new-donation', {
        ...donationData,
        moderation_status: moderationStatus,
        action: shouldAutoApprove ? 'auto_approved' : 'pending'
      })

      // Calculate and send leaderboard update (only for approved donations to reduce egress)
      if (shouldAutoApprove) {
        try {
          const { data: allDonations } = await supabase
            .from(tableName)
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
            
            await sendPusherEvent([`${pusherSlug}-dashboard`], 'leaderboard-updated', {
              topDonator: sortedDonators[0] || null,
              latestDonation: {
                name: donation.name,
                amount: donation.amount,
                currency: paymentCurrency,
                created_at: donation.created_at,
              }
            });
            console.log(`Leaderboard update sent for ${pusherSlug}`);
          }
        } catch (leaderboardError) {
          console.error('Error calculating leaderboard:', leaderboardError);
        }
      }

      // Telegram notifications (if enabled)
      const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
      if (telegramBotToken && streamerSettings?.telegram_moderation_enabled) {
        try {
          // Fetch moderators
          const { data: moderators, error: modError } = await supabase
            .from('streamers_moderators')
            .select('telegram_user_id, mod_name, role, can_approve, can_reject, can_hide_message, can_ban, can_replay')
            .eq('streamer_id', donation.streamer_id)
            .eq('is_active', true);

          if (modError) {
            console.error('Error fetching moderators:', modError);
          } else if (moderators && moderators.length > 0) {
            console.log(`Found ${moderators.length} active moderators for streamer ${donation.streamer_id}`);

            const isManualMode = !shouldAutoApprove;
            const isPending = moderationStatus === 'pending';

            // Build message with HTML formatting
            let messageText = isManualMode && isPending
              ? `🎁 <b>New Donation - Needs Approval</b> 🎁\n\n`
              : `🎁 <b>New Donation Received!</b> 🎁\n\n`;
            
            messageText += `💰 <b>Amount:</b> ₹${donation.amount}\n`;
            messageText += `👤 <b>From:</b> ${donation.name}\n`;
            messageText += `📅 <b>Time:</b> ${new Date(donation.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n`;
            
            if (donation.message) {
              const truncatedMsg = donation.message.substring(0, 200) + (donation.message.length > 200 ? '...' : '');
              messageText += `💬 <b>Message:</b> ${truncatedMsg}\n`;
            }
            
            if (donation.voice_message_url) {
              messageText += `🎵 <b>Voice:</b> Available\n`;
            }

            if (donation.media_url) {
              const mediaTypeEmoji = donation.media_type?.startsWith('video') ? '🎬' : '🖼️';
              messageText += `${mediaTypeEmoji} <b>Media:</b> Attached\n`;
            }

            if (donation.is_hyperemote) {
              messageText += `✨ <b>HyperEmote:</b> Activated\n`;
            }

            const statusEmoji = isPending ? '⏳' : '✅';
            const statusText = isPending ? 'Pending Approval' : 'Auto-Approved';
            messageText += `\n${statusEmoji} <i>${statusText}</i>`;

            for (const mod of moderators) {
              try {
                // Build keyboard based on mode and permissions using shortened callback_data
                const keyboard: any[][] = [];
                
                if (isManualMode && isPending) {
                  // Row 1: Approve/Reject for pending manual mode
                  const row1: any[] = [];
                  if (mod.role === 'owner' || mod.can_approve) {
                    const approveCallback = await createCallbackMapping(supabase, donation.id, tableName, donation.streamer_id, 'approve');
                    row1.push({ text: '✅ Approve', callback_data: approveCallback });
                  }
                  if (mod.role === 'owner' || mod.can_reject) {
                    const rejectCallback = await createCallbackMapping(supabase, donation.id, tableName, donation.streamer_id, 'reject');
                    row1.push({ text: '❌ Reject', callback_data: rejectCallback });
                  }
                  if (row1.length > 0) keyboard.push(row1);

                  // Row 2: Hide/Ban
                  const row2: any[] = [];
                  if ((mod.role === 'owner' || mod.can_hide_message) && donation.message) {
                    const hideCallback = await createCallbackMapping(supabase, donation.id, tableName, donation.streamer_id, 'hide_message');
                    row2.push({ text: '🙈 Hide Msg', callback_data: hideCallback });
                  }
                  if (mod.role === 'owner' || mod.can_ban) {
                    const banCallback = await createCallbackMapping(supabase, donation.id, tableName, donation.streamer_id, 'ban_donor');
                    row2.push({ text: '🚫 Ban', callback_data: banCallback });
                  }
                  if (row2.length > 0) keyboard.push(row2);
                } else {
                  // For auto-approved: show replay and hide options
                  const row: any[] = [];
                  if (donation.message && (mod.role === 'owner' || mod.can_hide_message)) {
                    const hideCallback = await createCallbackMapping(supabase, donation.id, tableName, donation.streamer_id, 'hide_message');
                    row.push({ text: '🙈 Hide Msg', callback_data: hideCallback });
                  }
                  if (mod.role === 'owner' || mod.can_replay) {
                    const replayCallback = await createCallbackMapping(supabase, donation.id, tableName, donation.streamer_id, 'replay');
                    row.push({ text: '🔄 Replay', callback_data: replayCallback });
                  }
                  if (row.length > 0) keyboard.push(row);
                }

                // Dashboard link
                keyboard.push([{ text: '📊 Dashboard', url: `https://hyperchat.site/dashboard/${pusherSlug}` }]);

                const textResponse = await fetch(
                  `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: mod.telegram_user_id,
                      text: messageText,
                      parse_mode: 'HTML',
                      disable_web_page_preview: true,
                      reply_markup: keyboard.length > 0 ? { inline_keyboard: keyboard } : undefined
                    })
                  }
                );

                const responseData = await textResponse.json();
                
                if (!textResponse.ok || !responseData.ok) {
                  console.error(`Failed to send text to ${mod.mod_name}:`, JSON.stringify(responseData));
                  continue;
                }

                console.log(`✅ Text notification sent to ${mod.mod_name}`);

                // Send voice message if present
                if (donation.voice_message_url) {
                  const voiceResponse = await fetch(
                    `https://api.telegram.org/bot${telegramBotToken}/sendVoice`,
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        chat_id: mod.telegram_user_id,
                        voice: donation.voice_message_url,
                        caption: `🎤 Voice message from ${donation.name}`
                      })
                    }
                  );

                  if (voiceResponse.ok) {
                    console.log(`✅ Voice message sent to ${mod.mod_name}`);
                  } else {
                    const errorText = await voiceResponse.text();
                    console.error(`Failed to send voice to ${mod.mod_name}:`, errorText);
                  }
                }

                // Send media (image/video/gif) if present
                if (donation.media_url) {
                  const isVideo = donation.media_type === 'video';
                  
                  if (isVideo) {
                    // Send video
                    const videoResponse = await fetch(
                      `https://api.telegram.org/bot${telegramBotToken}/sendVideo`,
                      {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          chat_id: mod.telegram_user_id,
                          video: donation.media_url,
                          caption: `🎬 Video from ${donation.name} - ₹${donation.amount}`
                        })
                      }
                    );

                    if (videoResponse.ok) {
                      console.log(`✅ Video sent to ${mod.mod_name}`);
                    } else {
                      const errorText = await videoResponse.text();
                      console.error(`Failed to send video to ${mod.mod_name}:`, errorText);
                    }
                  } else {
                    // Send image or GIF
                    const photoResponse = await fetch(
                      `https://api.telegram.org/bot${telegramBotToken}/sendPhoto`,
                      {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          chat_id: mod.telegram_user_id,
                          photo: donation.media_url,
                          caption: `${donation.media_type === 'gif' ? '✨ GIF' : '🖼️ Image'} from ${donation.name} - ₹${donation.amount}`
                        })
                      }
                    );

                    if (photoResponse.ok) {
                      console.log(`✅ Photo/GIF sent to ${mod.mod_name}`);
                    } else {
                      const errorText = await photoResponse.text();
                      console.error(`Failed to send photo to ${mod.mod_name}:`, errorText);
                    }
                  }
                }

                await new Promise(resolve => setTimeout(resolve, 100));
              } catch (modNotifyError) {
                console.error(`Error notifying mod ${mod.mod_name}:`, modNotifyError);
              }
            }
          } else {
            console.log('No active moderators found for streamer');
          }
        } catch (telegramError) {
          console.error('Error sending Telegram notifications:', telegramError);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, status: newStatus }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Razorpay webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
