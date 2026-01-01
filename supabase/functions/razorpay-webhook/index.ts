// Updated: 2026-01-01 - Restored moderation system, respects streamer moderation_mode setting
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
};

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

    // Verify webhook signature if secret is configured
    if (webhookSecret && webhookSignature) {
      const expectedSignature = createHmac('sha256', webhookSecret)
        .update(webhookBody)
        .digest('hex')

      if (webhookSignature !== expectedSignature) {
        console.error('Invalid webhook signature')
        return new Response('Invalid signature', { status: 400, headers: corsHeaders })
      }
      console.log('Webhook signature verified ✓')
    } else if (!webhookSecret) {
      console.warn('⚠️ Webhook secret not configured - skipping signature verification (less secure)')
    } else if (!webhookSignature) {
      console.warn('⚠️ No signature in webhook - skipping verification')
    }

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
    let streamerType: 'ankit' | 'thunderx' | 'vipbhai' | 'sagarujjwalgaming' | 'notyourkween' | 'bongflick' | 'mriqmaster' | 'abdevil' | 'looteriyagaming' | 'damaskplays' | 'nekoxenpai' | 'jhanvoo' | 'clumsygod' | 'jimmygaming'
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
                                fetchError = ankitResult.error || thunderxResult.error || vipbhaiResult.error || sagarujjwalgamingResult.error || notyourkweenResult.error || bongflickResult.error || mriqmasterResult.error || abdevilResult.error || looteriyaGamingResult.error || damaskPlaysResult.error || nekoXenpaiResult.error || jhanvooResult.error || clumsygodResult.error || jimmyGamingResult.error
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
      .select('moderation_mode, telegram_moderation_enabled')
      .eq('id', donation.streamer_id)
      .single();

    if (streamerError) {
      console.error('Error fetching streamer settings:', streamerError);
    }

    const moderationMode = streamerSettings?.moderation_mode || 'auto_approve';
    const shouldAutoApprove = moderationMode === 'auto_approve';
    const moderationStatus = shouldAutoApprove ? 'auto_approved' : 'pending';
    
    console.log(`Streamer moderation_mode: ${moderationMode}, shouldAutoApprove: ${shouldAutoApprove}`);

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
        const bodyMd5 = createHash('md5').update(pusherBody).digest('hex')
        const authString = `POST\n/apps/${pusherAppId}/events\nauth_key=${pusherKey}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${bodyMd5}`
        const authSignature = createHmac('sha256', pusherSecret).update(authString).digest('hex')
        const pusherUrlWithAuth = `${pusherUrl}?auth_key=${pusherKey}&auth_timestamp=${timestamp}&auth_version=1.0&auth_signature=${authSignature}&body_md5=${bodyMd5}`
        
        await fetch(pusherUrlWithAuth, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: pusherBody
        })
      }

      // Get streamer slug for channel names
      const channelSlug = streamerType === 'thunderx' ? 'thunderx'
        : streamerType === 'vipbhai' ? 'vipbhai'
        : streamerType === 'sagarujjwalgaming' ? 'sagarujjwalgaming'
        : streamerType === 'notyourkween' ? 'notyourkween'
        : streamerType === 'bongflick' ? 'bongflick'
        : streamerType === 'mriqmaster' ? 'mriqmaster'
        : streamerType === 'abdevil' ? 'abdevil'
        : streamerType === 'looteriyagaming' ? 'looteriya_gaming'
        : streamerType === 'damaskplays' ? 'damask_plays'
        : streamerType === 'nekoxenpai' ? 'neko_xenpai'
        : streamerType === 'jhanvoo' ? 'jhanvoo'
        : streamerType === 'clumsygod' ? 'clumsygod'
        : streamerType === 'jimmygaming' ? 'jimmy_gaming'
        : 'ankit';

      // Send to dashboard channel for real-time updates
      await sendPusherEvent([`${channelSlug}-dashboard`], 'new-donation', {
        id: donation.id,
        name: donation.name,
        amount: donation.amount,
        currency: paymentCurrency,
        message: donation.message,
        is_hyperemote: donation.is_hyperemote,
        hypersound_url: donation.hypersound_url,
        voice_message_url: donation.voice_message_url,
        created_at: donation.created_at,
        moderation_status: moderationStatus
      });
      console.log(`✅ Pusher dashboard event sent to ${channelSlug}-dashboard`);

      // Only send to OBS alerts channel if auto-approved
      if (shouldAutoApprove) {
        await sendPusherEvent([`${channelSlug}-alerts`], 'new-donation', {
          id: donation.id,
          name: donation.name,
          amount: donation.amount,
          currency: paymentCurrency,
          message: donation.message,
          is_hyperemote: donation.is_hyperemote,
          hypersound_url: donation.hypersound_url,
          voice_message_url: donation.voice_message_url,
          created_at: donation.created_at
        });
        console.log(`✅ Pusher alerts event sent to ${channelSlug}-alerts (auto-approved)`);
      } else {
        console.log(`⏸️ Skipping OBS alerts - donation pending moderation (mode: ${moderationMode})`);
      }

      // TTS Generation Logic - Only generate TTS if auto-approved
      if (shouldAutoApprove) {
        const donationCurrency = paymentCurrency || 'INR';
        const amountInINR = convertToINR(donation.amount, donationCurrency);

        // Skip TTS for HyperSounds/HyperEmotes
        if (!donation.hypersound_url && !donation.is_hyperemote) {
          
          // Voice Messages - Generate announcement TTS
          if (donation.voice_message_url) {
            console.log('Voice message donation - generating announcement TTS');
            try {
              const ttsResponse = await fetch(`${supabaseUrl}/functions/v1/generate-donation-tts`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`
                },
                body: JSON.stringify({
                  username: donation.name,
                  amount: donation.amount,
                  message: null,
                  donationId: donation.id,
                  streamerId: donation.streamer_id,
                  isVoiceAnnouncement: true,
                  currency: donationCurrency
                })
              });
              
              if (!ttsResponse.ok) {
                const errorText = await ttsResponse.text();
                console.error('Announcement TTS error:', errorText);
              } else {
                const ttsData = await ttsResponse.json();
                if (ttsData?.audioUrl) {
                  console.log('Announcement TTS generated:', ttsData.audioUrl);
                }
              }
            } catch (error) {
              console.error('TTS generation error:', error);
            }
          }
          
          // Text Messages - Generate full TTS for ₹70+ (INR equivalent)
          else if (donation.message && amountInINR >= 70) {
            console.log(`Generating TTS for ₹${amountInINR} text donation`);
            try {
              const ttsResponse = await fetch(`${supabaseUrl}/functions/v1/generate-donation-tts`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabaseServiceKey}`
                },
                body: JSON.stringify({
                  username: donation.name,
                  amount: donation.amount,
                  message: donation.message,
                  donationId: donation.id,
                  streamerId: donation.streamer_id,
                  currency: donationCurrency
                })
              });
              
              if (!ttsResponse.ok) {
                const errorText = await ttsResponse.text();
                console.error('TTS error:', errorText);
              } else {
                const ttsData = await ttsResponse.json();
                if (ttsData?.audioUrl) {
                  console.log('TTS generated successfully:', ttsData.audioUrl);
                }
              }
            } catch (error) {
              console.error('TTS generation error:', error);
            }
          } else {
            console.log(`Donation ₹${amountInINR} - below TTS threshold or no message`);
          }
        } else {
          console.log('HyperSound/HyperEmote donation - skipping TTS');
        }
      } else {
        console.log('⏸️ Skipping TTS generation - donation pending moderation');
      }

      // For Ankit, check if there's an active goal and send progress update
      if (streamerType === 'ankit') {
        try {
          const { data: streamer, error: goalError } = await supabase
            .from('streamers')
            .select('goal_is_active, goal_activated_at, goal_target_amount')
            .eq('id', donation.streamer_id)
            .single();

          if (!goalError && streamer?.goal_is_active && streamer.goal_activated_at) {
            const { data: donations, error: donError } = await supabase
              .from('ankit_donations')
              .select('amount')
              .eq('streamer_id', donation.streamer_id)
              .eq('payment_status', 'success')
              .gte('created_at', streamer.goal_activated_at);

            if (!donError && donations) {
              const newTotal = donations.reduce((sum, d) => sum + Number(d.amount), 0);
              
              await sendPusherEvent(['ankit-goal'], 'goal-progress', {
                currentAmount: newTotal,
                targetAmount: streamer.goal_target_amount,
              });

              console.log('Goal progress update sent:', newTotal);
            }
          }
        } catch (error) {
          console.error('Error sending goal progress update:', error);
        }
      }

      // Send Telegram notification to moderators
      try {
        console.log('Sending Telegram notification to moderators for donation:', donation.id);
        
        const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
        if (!telegramBotToken) {
          console.log('TELEGRAM_BOT_TOKEN not configured, skipping Telegram notification');
        } else {
          const { data: moderators, error: modError } = await supabase
            .from('streamers_moderators')
            .select('telegram_user_id, mod_name')
            .eq('streamer_id', donation.streamer_id)
            .eq('is_active', true);

          if (modError) {
            console.error('Error fetching moderators:', modError);
          } else if (moderators && moderators.length > 0) {
            console.log(`Found ${moderators.length} active moderators for streamer ${donation.streamer_id}`);

            // Different message based on moderation mode
            const statusText = shouldAutoApprove 
              ? `✅ Auto-approved and sent to OBS`
              : `⏳ *Awaiting moderation approval*`;

            const messageText = `🎉 *New Donation Received!*\n\n` +
              `👤 From: *${donation.name}*\n` +
              `💰 Amount: ₹${donation.amount}\n` +
              (donation.message ? `💬 Message: "${donation.message}"\n` : '') +
              (donation.is_hyperemote ? `✨ HyperEmote activated!\n` : '') +
              `📅 Time: ${new Date(donation.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\n` +
              statusText;

            for (const mod of moderators) {
              try {
                const textResponse = await fetch(
                  `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: mod.telegram_user_id,
                      text: messageText,
                      parse_mode: 'Markdown',
                      reply_markup: {
                        inline_keyboard: [[
                          {
                            text: '📊 View Dashboard',
                            url: `https://hyperchat.site/dashboard/${pusherSlug}`
                          }
                        ]]
                      }
                    })
                  }
                );

                if (!textResponse.ok) {
                  const errorText = await textResponse.text();
                  console.error(`Failed to send text to ${mod.mod_name}:`, errorText);
                  continue;
                }

                console.log(`✅ Text notification sent to ${mod.mod_name}`);

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

                await new Promise(resolve => setTimeout(resolve, 100));
              } catch (modNotifyError) {
                console.error(`Error notifying mod ${mod.mod_name}:`, modNotifyError);
              }
            }
          } else {
            console.log('No active moderators found for streamer');
          }
        }
      } catch (telegramError) {
        console.error('Error sending Telegram notifications:', telegramError);
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
