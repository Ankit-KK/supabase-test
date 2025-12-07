import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHash, createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
}

// Mapping from streamerType to correct streamer_slug (for database lookup)
const streamerSlugMap: Record<string, string> = {
  'looteriyagaming': 'looteriya_gaming',
  'damaskplays': 'damask_plays',
  'nekoxenpai': 'neko_xenpai',
  // Other streamers stay as-is since they match
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

    // Extract Razorpay order ID from payment entity
    const razorpayOrderId = webhookData.payload?.payment?.entity?.order_id
    
    console.log('Razorpay Order ID:', razorpayOrderId)
    
    if (!razorpayOrderId) {
      console.log('No Razorpay order ID found, ignoring')
      return new Response('No order ID', { status: 400, headers: corsHeaders })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Determine table based on order ID prefix (supports both old and new formats)
    let streamerType: 'ankit' | 'thunderx' | 'vipbhai' | 'sagarujjwalgaming' | 'notyourkween' | 'bongflick' | 'mriqmaster' | 'abdevil' | 'looteriyagaming' | 'damaskplays' | 'nekoxenpai' | 'jhanvoo' | 'clumsygod'
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
                              fetchError = ankitResult.error || thunderxResult.error || vipbhaiResult.error || sagarujjwalgamingResult.error || notyourkweenResult.error || bongflickResult.error || mriqmasterResult.error || abdevilResult.error || looteriyaGamingResult.error || damaskPlaysResult.error || nekoXenpaiResult.error || jhanvooResult.error || clumsygodResult.error
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
      console.log('Payment already processed:', orderId)
      return new Response('Already processed', { status: 200, headers: corsHeaders })
    }

    const isSuccess = event === 'payment.captured'
    const newStatus = isSuccess ? 'success' : 'failed'

    console.log('Updating payment status to:', newStatus)

    // Update donation status
    const updateData: any = {
      payment_status: newStatus,
      updated_at: new Date().toISOString()
    }

    // Note: moderation_status is handled by database trigger
    // All donations are auto-approved by auto_approve_ankit_hyperemotes_iu()

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
      // Get group-specific Pusher credentials based on streamer (use correct slug for database lookup)
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

      // Send new-donation event to alerts and dashboard channels based on streamer type
      const alertChannels = streamerType === 'thunderx' 
        ? ['thunderx-alerts', 'thunderx-dashboard'] 
        : streamerType === 'vipbhai'
        ? ['vipbhai-alerts', 'vipbhai-dashboard']
        : streamerType === 'sagarujjwalgaming'
        ? ['sagarujjwalgaming-alerts', 'sagarujjwalgaming-dashboard']
        : streamerType === 'notyourkween'
        ? ['notyourkween-alerts', 'notyourkween-dashboard']
        : streamerType === 'bongflick'
        ? ['bongflick-alerts', 'bongflick-dashboard']
        : streamerType === 'mriqmaster'
        ? ['mriqmaster-alerts', 'mriqmaster-dashboard']
        : streamerType === 'abdevil'
        ? ['abdevil-alerts', 'abdevil-dashboard']
        : streamerType === 'looteriyagaming'
        ? ['looteriya_gaming-alerts', 'looteriya_gaming-dashboard']
        : streamerType === 'damaskplays'
        ? ['damask_plays-alerts', 'damask_plays-dashboard']
        : streamerType === 'nekoxenpai'
        ? ['neko_xenpai-alerts', 'neko_xenpai-dashboard']
        : streamerType === 'jhanvoo'
        ? ['jhanvoo-alerts', 'jhanvoo-dashboard']
        : streamerType === 'clumsygod'
        ? ['clumsygod-alerts', 'clumsygod-dashboard']
        : ['ankit-alerts', 'ankit-dashboard']
      
      await sendPusherEvent(alertChannels, 'new-donation', {
        id: donation.id,
        name: donation.name,
        amount: donation.amount,
        message: donation.message,
        is_hyperemote: donation.is_hyperemote,
        voice_message_url: donation.voice_message_url,
        created_at: donation.created_at
      })

      console.log('Pusher events sent to alerts and dashboard')

      // For Ankit, check if there's an active goal and send progress update
      if (streamerType === 'ankit') {
        try {
          const { data: streamer, error: goalError } = await supabase
            .from('streamers')
            .select('goal_is_active, goal_activated_at, goal_target_amount')
            .eq('id', donation.streamer_id)
            .single();

          if (!goalError && streamer?.goal_is_active && streamer.goal_activated_at) {
            // Calculate new total
            const { data: donations, error: donError } = await supabase
              .from('ankit_donations')
              .select('amount')
              .eq('streamer_id', donation.streamer_id)
              .eq('payment_status', 'success')
              .gte('created_at', streamer.goal_activated_at);

            if (!donError && donations) {
              const newTotal = donations.reduce((sum, d) => sum + Number(d.amount), 0);
              
              // Send goal progress update to Pusher
              await sendPusherEvent(['ankit-goal'], 'goal-progress', {
                currentAmount: newTotal,
                targetAmount: streamer.goal_target_amount,
              });

              console.log('Goal progress update sent:', newTotal);
            }
          }
        } catch (error) {
          console.error('Error sending goal progress update:', error);
          // Don't fail the webhook if goal update fails
        }
      }

      // Send Telegram notification to moderators
      try {
        console.log('Sending Telegram notification to moderators for donation:', donation.id);
        
        const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
        if (!telegramBotToken) {
          console.log('TELEGRAM_BOT_TOKEN not configured, skipping Telegram notification');
        } else {
          // Get active moderators for this streamer
          const { data: moderators, error: modError } = await supabase
            .from('streamers_moderators')
            .select('telegram_user_id, mod_name')
            .eq('streamer_id', donation.streamer_id)
            .eq('is_active', true);

          if (modError) {
            console.error('Error fetching moderators:', modError);
          } else if (moderators && moderators.length > 0) {
            console.log(`Found ${moderators.length} active moderators for streamer ${donation.streamer_id}`);

            // Prepare notification message
            const messageText = `🎉 *New Donation Received!*\n\n` +
              `👤 From: *${donation.name}*\n` +
              `💰 Amount: ₹${donation.amount}\n` +
              (donation.message ? `💬 Message: "${donation.message}"\n` : '') +
              (donation.is_hyperemote ? `✨ HyperEmote activated!\n` : '') +
              `📅 Time: ${new Date(donation.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;

            // Send notification to each moderator
            for (const mod of moderators) {
              try {
                // Send text notification
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

                // Send voice message if available
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

                // Small delay to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 100));

              } catch (modError) {
                console.error(`Error notifying moderator ${mod.mod_name}:`, modError);
              }
            }

            // Mark donation as notified
            const { error: updateNotifiedError } = await supabase
              .from(tableName)
              .update({ mod_notified: true })
              .eq('id', donation.id);

            if (updateNotifiedError) {
              console.error('Error updating mod_notified:', updateNotifiedError);
            } else {
              console.log(`✅ Donation ${donation.id} marked as notified`);
            }
          } else {
            console.log('No active moderators found for this streamer');
          }
        }
      } catch (telegramError) {
        console.error('Telegram notification error:', telegramError);
        // Don't throw - we don't want to fail the webhook if Telegram fails
      }

      // Handle TTS generation and audio channel events based on donation type
      // 1. HYPEREMOTES - NO TTS, just visual effects
      if (donation.is_hyperemote) {
        console.log('Hyperemote donation - skipping TTS, visual alert only')
        // No audio channel event for hyperemotes
      }
      
      // 2. VOICE MESSAGES - Generate announcement TTS + play voice
      else if (donation.voice_message_url) {
        console.log('Voice message donation - generating announcement TTS')
        
        try {
          const { data: announcementTTS, error: announcementError } = await supabase.functions.invoke('generate-donation-tts', {
            body: {
              username: donation.name,
              amount: donation.amount,
              message: null,
              donationId: donation.id,
              streamerId: donation.streamer_id,
              isVoiceAnnouncement: true
            }
          })
          
          if (announcementError) {
            console.error('Announcement TTS generation error:', announcementError)
          } else if (announcementTTS?.audioUrl) {
            console.log('Announcement TTS generated successfully, sending to audio channel')
            
            // Send audio event with BOTH announcement TTS and voice URL
            const audioChannel = streamerType === 'thunderx' 
              ? ['thunderx-audio'] 
              : streamerType === 'vipbhai'
              ? ['vipbhai-audio']
              : streamerType === 'sagarujjwalgaming'
              ? ['sagarujjwalgaming-audio']
              : streamerType === 'notyourkween'
              ? ['notyourkween-audio']
              : streamerType === 'bongflick'
              ? ['bongflick-audio']
              : streamerType === 'mriqmaster'
              ? ['mriqmaster-audio']
              : streamerType === 'abdevil'
              ? ['abdevil-audio']
              : streamerType === 'looteriyagaming'
              ? ['looteriya_gaming-audio']
              : streamerType === 'damaskplays'
              ? ['damask_plays-audio']
              : streamerType === 'nekoxenpai'
              ? ['neko_xenpai-audio']
              : streamerType === 'jhanvoo'
              ? ['jhanvoo-audio']
              : ['ankit-audio']
            await sendPusherEvent(audioChannel, 'new-audio-message', {
              id: donation.id,
              name: donation.name,
              amount: donation.amount,
              message: null,
              announcement_tts_url: announcementTTS.audioUrl, // Play this first
              voice_message_url: donation.voice_message_url, // Then play this
              tts_audio_url: null,
              created_at: donation.created_at
            })
            
            console.log(`✅ Voice message with announcement sent to ${streamerType}-audio`)
          }
        } catch (error) {
          console.error('Voice message announcement error:', error)
        }
      }
      
      // 3. TEXT MESSAGES - Conditional TTS based on amount
      else if (donation.message) {
        // ₹40-69: Display only, NO TTS
        if (donation.amount >= 40 && donation.amount < 70) {
          console.log('Text donation ₹40-69 - displaying without TTS')
          // Alert already sent to dashboard, no audio event needed
        }
        
        // ₹70+: Display + Generate TTS
        else if (donation.amount >= 70) {
          console.log('Text donation ₹70+ - generating TTS')
          
          try {
            const { data: ttsData, error: ttsError } = await supabase.functions.invoke('generate-donation-tts', {
              body: {
                username: donation.name,
                amount: donation.amount,
                message: donation.message,
                donationId: donation.id,
                streamerId: donation.streamer_id,
                isVoiceAnnouncement: false
              }
            })
            
            if (ttsError) {
              console.error('TTS generation error:', ttsError)
            } else if (ttsData?.audioUrl) {
              console.log('TTS generated successfully, sending to audio channel')
              
              // Send audio event with TTS URL
              const audioChannel = streamerType === 'thunderx' 
                ? ['thunderx-audio'] 
                : streamerType === 'vipbhai'
                ? ['vipbhai-audio']
                : streamerType === 'sagarujjwalgaming'
                ? ['sagarujjwalgaming-audio']
                : streamerType === 'notyourkween'
                ? ['notyourkween-audio']
                : streamerType === 'bongflick'
                ? ['bongflick-audio']
                : streamerType === 'mriqmaster'
                ? ['mriqmaster-audio']
                : streamerType === 'abdevil'
                ? ['abdevil-audio']
                : streamerType === 'looteriyagaming'
                ? ['looteriya_gaming-audio']
                : streamerType === 'damaskplays'
                ? ['damask_plays-audio']
                : streamerType === 'nekoxenpai'
                ? ['neko_xenpai-audio']
                : streamerType === 'jhanvoo'
                ? ['jhanvoo-audio']
                : ['ankit-audio']
              await sendPusherEvent(audioChannel, 'new-audio-message', {
                id: donation.id,
                name: donation.name,
                amount: donation.amount,
                message: donation.message,
                announcement_tts_url: null,
                voice_message_url: null,
                tts_audio_url: ttsData.audioUrl,
                created_at: donation.created_at
              })
              
              console.log(`✅ Text message with TTS sent to ${streamerType}-audio`)
            }
          } catch (error) {
            console.error('Text TTS generation error:', error)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, status: newStatus }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

