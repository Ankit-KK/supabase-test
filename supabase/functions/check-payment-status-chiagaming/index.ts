import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { createHash, createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to get Pusher credentials based on group
function getPusherCredentials(group: number) {
  const suffix = group === 1 ? '' : `_${group}`;
  return {
    appId: Deno.env.get(`PUSHER_APP_ID${suffix}`) || '',
    key: Deno.env.get(`PUSHER_KEY${suffix}`) || '',
    secret: Deno.env.get(`PUSHER_SECRET${suffix}`) || '',
    cluster: Deno.env.get(`PUSHER_CLUSTER${suffix}`) || 'ap2'
  };
}

// Pusher client class (matching razorpay-webhook format)
class PusherClient {
  private appId: string;
  private key: string;
  private secret: string;
  private cluster: string;

  constructor(appId: string, key: string, secret: string, cluster: string) {
    this.appId = appId;
    this.key = key;
    this.secret = secret;
    this.cluster = cluster;
  }

  async trigger(channel: string, event: string, data: any): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    // Create payload in SAME format as razorpay-webhook (channels array, not channel string)
    const pusherPayload = {
      name: event,
      channels: [channel],
      data: JSON.stringify(data)
    };
    
    const pusherBody = JSON.stringify(pusherPayload);
    const bodyMd5 = this.md5(pusherBody);
    
    const stringToSign = `POST\n/apps/${this.appId}/events\nauth_key=${this.key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${bodyMd5}`;
    const signature = this.hmacSha256Sync(stringToSign, this.secret);
    
    const url = `https://api-${this.cluster}.pusher.com/apps/${this.appId}/events?auth_key=${this.key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${bodyMd5}&auth_signature=${signature}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: pusherBody
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ChiaGaming] Pusher error:', response.status, errorText);
      throw new Error(`Pusher error: ${response.status}`);
    }
    
    return response.json();
  }

  private md5(message: string): string {
    return createHash('md5').update(message).digest('hex');
  }

  private hmacSha256Sync(message: string, secret: string): string {
    return createHmac('sha256', secret).update(message).digest('hex');
  }
}

// Generate short ID for Telegram callback mapping
function generateShortId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create callback mapping for Telegram
async function createCallbackMapping(
  supabase: any,
  donationId: string,
  tableName: string,
  action: string
): Promise<string> {
  const shortId = generateShortId();
  const callbackData = `${action}:${shortId}`;
  
  await supabase.from('telegram_callback_mapping').insert({
    short_id: shortId,
    donation_id: donationId,
    table_name: tableName,
    action: action,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });
  
  return callbackData;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();
    console.log('[ChiaGaming] Checking payment status for:', order_id);

    if (!order_id) {
      throw new Error('Order ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get donation from database
    const { data: donation, error: dbError } = await supabase
      .from('chiaa_gaming_donations')
      .select('*')
      .eq('order_id', order_id)
      .single();

    if (dbError || !donation) {
      console.error('[ChiaGaming] Donation not found:', dbError);
      throw new Error('Donation not found');
    }

    // If already successful, return immediately
    if (donation.payment_status === 'success') {
      console.log('[ChiaGaming] Payment already successful');
      return new Response(
        JSON.stringify({
          order_id: order_id,
          final_status: 'SUCCESS',
          payment_status: 'success',
          order_status: 'PAID',
          order_amount: donation.amount,
          customer_details: { customer_name: donation.name }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check Razorpay order status using STANDARDIZED credentials
    const razorpayKeyId = Deno.env.get('razorpay-keyid');
    const razorpayKeySecret = Deno.env.get('razorpay-keysecret');

    if (!razorpayKeyId || !razorpayKeySecret || !donation.razorpay_order_id) {
      console.error('[ChiaGaming] Missing Razorpay credentials or order ID');
      throw new Error('Unable to check Razorpay status');
    }

    const razorpayAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    
    // Get order status
    const orderResponse = await fetch(
      `https://api.razorpay.com/v1/orders/${donation.razorpay_order_id}`,
      { headers: { 'Authorization': `Basic ${razorpayAuth}` } }
    );

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('[ChiaGaming] Razorpay API error:', {
        status: orderResponse.status,
        body: errorText,
        orderId: donation.razorpay_order_id
      });
      
      // Return pending instead of error for transient failures
      return new Response(
        JSON.stringify({
          order_id,
          final_status: 'PENDING',
          payment_status: 'pending',
          error_details: `Razorpay returned ${orderResponse.status}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const razorpayOrder = await orderResponse.json();
    console.log('[ChiaGaming] Razorpay order status:', razorpayOrder.status);

    // Get payments for more detailed status
    const paymentsResponse = await fetch(
      `https://api.razorpay.com/v1/orders/${donation.razorpay_order_id}/payments`,
      { headers: { 'Authorization': `Basic ${razorpayAuth}` } }
    );

    let payments: any[] = [];
    if (paymentsResponse.ok) {
      const paymentsData = await paymentsResponse.json();
      payments = paymentsData.items || [];
    }

    // Determine final status
    let finalStatus = 'pending';
    if (razorpayOrder.status === 'paid' || payments.some((p: any) => p.status === 'captured')) {
      finalStatus = 'success';
    } else if (payments.some((p: any) => p.status === 'failed')) {
      finalStatus = 'failure';
    }

    // Process successful payment (fallback processing if webhook didn't fire)
    if (finalStatus === 'success' && donation.payment_status !== 'success') {
      console.log('[ChiaGaming] Processing successful payment via fallback...');

      // Get streamer info for moderation mode and Pusher
      const { data: streamer } = await supabase
        .from('streamers')
        .select('*, moderation_mode, telegram_moderation_enabled, media_moderation_enabled')
        .eq('streamer_slug', 'chiaa_gaming')
        .single();

      // Determine moderation status based on streamer settings
      const moderationMode = streamer?.moderation_mode || 'auto';
      const hasHypersoundContent = hasHypersound || donation.is_hyperemote;
      const mediaRequiresModeration = hasMedia && streamer?.media_moderation_enabled;
      
      // HyperSounds always auto-approve, media goes to moderation if enabled
      const shouldAutoApprove = hasHypersoundContent || 
        (moderationMode !== 'manual' && !mediaRequiresModeration);
      const newModerationStatus = shouldAutoApprove ? 'auto_approved' : 'pending';

      console.log(`[ChiaGaming] Moderation: mode=${moderationMode}, hasMedia=${hasMedia}, mediaModEnabled=${streamer?.media_moderation_enabled}, shouldAutoApprove=${shouldAutoApprove}`);

      // Calculate audio_scheduled_at (60 seconds from now for fraud protection)
      const audioScheduledAt = new Date(Date.now() + 60 * 1000).toISOString();

      // Silent audio URL for text donations under ₹70 (triggers visual alert without TTS)
      const SILENT_AUDIO_URL = 'https://pub-fff13c27bb0d4a1e807dfc596462b7d5.r2.dev/silent.m4a';

      // Determine if we need to generate TTS
      let ttsAudioUrl = donation.tts_audio_url;
      const hasVoiceMessage = donation.voice_message_url && donation.voice_message_url.length > 0;
      const hasHypersound = donation.hypersound_url && donation.hypersound_url.length > 0;
      const hasMedia = donation.media_url && donation.media_url.length > 0;
      const isTextDonation = !hasVoiceMessage && !hasHypersound && !hasMedia;
      const ttsMinAmount = 70; // INR minimum for spoken TTS

      // Generate TTS using the shared generate-donation-tts function
      // Text donations with message >= ₹70 get full TTS, Media donations get announcement TTS
      const shouldGenerateTextTTS = isTextDonation && donation.message && donation.amount >= ttsMinAmount && !ttsAudioUrl && newModerationStatus === 'auto_approved';
      const shouldGenerateMediaTTS = hasMedia && newModerationStatus === 'auto_approved' && !ttsAudioUrl;
      // Text donations < ₹70 get silent audio (triggers visual alert without TTS cost)
      const shouldUseSilentAudio = isTextDonation && donation.amount < ttsMinAmount && newModerationStatus === 'auto_approved' && !ttsAudioUrl;

      if (shouldGenerateTextTTS || shouldGenerateMediaTTS) {
        console.log(`[ChiaGaming] Generating ${shouldGenerateMediaTTS ? 'media announcement' : 'text'} TTS via shared function...`);
        
        try {
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
                donationTable: 'chiaa_gaming_donations',
                username: donation.name,
                amount: donation.amount,
                message: shouldGenerateTextTTS ? donation.message : null,
                currency: donation.currency || 'INR',
                isMediaAnnouncement: shouldGenerateMediaTTS,
                mediaType: donation.media_type
              })
            }
          );

          if (ttsResponse.ok) {
            const ttsData = await ttsResponse.json();
            if (ttsData.audioUrl) {
              ttsAudioUrl = ttsData.audioUrl;
              console.log('[ChiaGaming] TTS generated:', ttsAudioUrl);
            }
          } else {
            const ttsError = await ttsResponse.text();
            console.error('[ChiaGaming] TTS generation failed:', ttsError);
          }
        } catch (ttsError) {
          console.error('[ChiaGaming] TTS generation error:', ttsError);
        }
      } else if (shouldUseSilentAudio) {
        // Use silent audio for text donations under ₹70 - triggers visual alert without TTS
        ttsAudioUrl = SILENT_AUDIO_URL;
        console.log('[ChiaGaming] Using silent audio for donation under threshold');
      }

      // Update donation in database
      const updateData: any = {
        payment_status: 'success',
        moderation_status: newModerationStatus,
        message_visible: true,
      };

      // Only set audio_scheduled_at for auto_approved donations
      if (newModerationStatus === 'auto_approved') {
        updateData.audio_scheduled_at = audioScheduledAt;
      }

      if (ttsAudioUrl) {
        updateData.tts_audio_url = ttsAudioUrl;
      }

      const { error: updateError } = await supabase
        .from('chiaa_gaming_donations')
        .update(updateData)
        .eq('order_id', order_id);

      if (updateError) {
        console.error('[ChiaGaming] Failed to update donation:', updateError);
      } else {
        console.log('[ChiaGaming] Donation updated successfully');
      }

      // Get dynamic Pusher credentials based on streamer's group
      const pusherGroup = streamer?.pusher_group || 1;
      const pusherCreds = getPusherCredentials(pusherGroup);
      
      console.log('[ChiaGaming] Using Pusher group:', pusherGroup);

      if (pusherCreds.appId && pusherCreds.key && pusherCreds.secret) {
        const pusher = new PusherClient(
          pusherCreds.appId,
          pusherCreds.key,
          pusherCreds.secret,
          pusherCreds.cluster
        );

        try {
          // Dashboard notification
          const dashboardPayload = {
            id: donation.id,
            name: donation.name,
            amount: donation.amount,
            message: donation.message,
            currency: donation.currency || 'INR',
            payment_status: 'success',
            moderation_status: newModerationStatus,
            created_at: donation.created_at,
            voice_message_url: donation.voice_message_url,
            hypersound_url: donation.hypersound_url,
            tts_audio_url: ttsAudioUrl,
            media_url: donation.media_url,
            media_type: donation.media_type,
          };

          await pusher.trigger('chiaa_gaming-dashboard', 'new-donation', dashboardPayload);
          console.log('[ChiaGaming] Dashboard notification sent');

          // Audio queue notification (only for auto_approved donations)
          if (newModerationStatus === 'auto_approved') {
            const audioPayload = {
              id: donation.id,
              name: donation.name,
              amount: donation.amount,
              message: donation.message,
              currency: donation.currency || 'INR',
              voice_message_url: donation.voice_message_url,
              hypersound_url: donation.hypersound_url,
              tts_audio_url: ttsAudioUrl,
              audio_scheduled_at: audioScheduledAt,
              created_at: donation.created_at,
              media_url: donation.media_url,
              media_type: donation.media_type,
            };

            await pusher.trigger('chiaa_gaming-audio', 'new-audio-message', audioPayload);
            console.log('[ChiaGaming] Audio queue notification sent');
          }

        } catch (pusherError) {
          console.error('[ChiaGaming] Pusher error:', pusherError);
        }

        // Goal progress update - ALWAYS on successful payment (regardless of moderation status)
        // This ensures goals update immediately when payment succeeds
        if (streamer?.goal_is_active && streamer?.goal_target_amount) {
          try {
            const EXCHANGE_RATES_TO_INR: Record<string, number> = { 'INR': 1, 'USD': 89, 'EUR': 94, 'GBP': 113, 'AED': 24, 'AUD': 57 };
            
            const { data: goalDonations } = await supabase
              .from('chiaa_gaming_donations')
              .select('amount, currency')
              .eq('payment_status', 'success')
              .gte('created_at', streamer.goal_activated_at || '1970-01-01');

            const totalRaised = goalDonations?.reduce((sum: number, d: any) => {
              const rate = EXCHANGE_RATES_TO_INR[d.currency || 'INR'] || 1;
              return sum + (d.amount || 0) * rate;
            }, 0) || 0;

            await pusher.trigger('chiaa_gaming-goal', 'goal-progress', {
              currentAmount: totalRaised,
              targetAmount: streamer.goal_target_amount,
            });
            console.log('[ChiaGaming] Goal progress notification sent:', totalRaised);
          } catch (goalError) {
            console.error('[ChiaGaming] Goal progress error:', goalError);
          }
        }
      } else {
        console.warn('[ChiaGaming] Pusher credentials not configured for group:', pusherGroup);
      }

      // Send Telegram notification if enabled and in manual moderation mode
      if (streamer?.telegram_moderation_enabled && newModerationStatus === 'pending') {
        console.log('[ChiaGaming] Sending Telegram notification...');
        
        try {
          // Get active moderators for this streamer
          const { data: moderators } = await supabase
            .from('streamers_moderators')
            .select('*')
            .eq('streamer_id', streamer.id)
            .eq('is_active', true)
            .not('telegram_chat_id', 'is', null);

          if (moderators && moderators.length > 0) {
            const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
            
            if (telegramBotToken) {
              const donationType = hasVoiceMessage ? '🎤 Voice' : hasHypersound ? '🔊 HyperSound' : '💬 Text';
              
              for (const mod of moderators) {
                // Create callback mappings for buttons
                const approveCallback = await createCallbackMapping(supabase, donation.id, 'chiaa_gaming_donations', 'approve');
                const rejectCallback = await createCallbackMapping(supabase, donation.id, 'chiaa_gaming_donations', 'reject');
                const hideCallback = await createCallbackMapping(supabase, donation.id, 'chiaa_gaming_donations', 'hide');
                const banCallback = await createCallbackMapping(supabase, donation.id, 'chiaa_gaming_donations', 'ban');
                
                const messageText = `🎁 *New Donation for Chiaa Gaming*

💰 *Amount:* ₹${donation.amount}
👤 *From:* ${donation.name}
${donationType}

${donation.message ? `💬 *Message:* ${donation.message}` : ''}

⏳ *Status:* Awaiting Moderation`;

                const keyboard = {
                  inline_keyboard: [
                    [
                      { text: '✅ Approve', callback_data: approveCallback },
                      { text: '❌ Reject', callback_data: rejectCallback }
                    ],
                    [
                      { text: '👁️ Hide Message', callback_data: hideCallback },
                      { text: '🚫 Ban User', callback_data: banCallback }
                    ]
                  ]
                };

                await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: mod.telegram_chat_id,
                    text: messageText,
                    parse_mode: 'Markdown',
                    reply_markup: keyboard
                  })
                });
              }
              console.log('[ChiaGaming] Telegram notifications sent to', moderators.length, 'moderators');
            }
          }
        } catch (telegramError) {
          console.error('[ChiaGaming] Telegram notification error:', telegramError);
        }
      }
    } else if (finalStatus === 'failure' && donation.payment_status !== 'failure') {
      console.log('[ChiaGaming] Updating payment status to failure');
      await supabase
        .from('chiaa_gaming_donations')
        .update({ payment_status: 'failure' })
        .eq('order_id', order_id);
    }

    return new Response(
      JSON.stringify({
        order_id: order_id,
        final_status: finalStatus.toUpperCase(),
        payment_status: finalStatus,
        order_status: razorpayOrder.status.toUpperCase(),
        order_amount: donation.amount,
        customer_details: { customer_name: donation.name },
        payments: payments.map((p: any) => ({
          id: p.id,
          status: p.status,
          method: p.method,
          amount: p.amount / 100,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[ChiaGaming] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, final_status: 'PENDING' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
