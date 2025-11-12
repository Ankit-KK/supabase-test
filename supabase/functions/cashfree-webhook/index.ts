// Updated: 2025-10-19 22:45 - Force redeploy to apply ChiaGaming channel mapping fixes
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import { Hash } from 'https://deno.land/x/checksum@1.4.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Pusher client for Deno
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

  async trigger(channel: string, event: string, data: any) {
    const body = JSON.stringify({ name: event, data: JSON.stringify(data), channel });
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Calculate MD5 hash of body using checksum library
    const hash = new Hash("md5");
    const bodyMd5 = hash.digest(new TextEncoder().encode(body)).hex();
    
    const authString = `POST\n/apps/${this.appId}/events\nauth_key=${this.key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${bodyMd5}`;
    const authSignature = await this.hmacSha256(authString, this.secret);
    
    const url = `https://api-${this.cluster}.pusher.com/apps/${this.appId}/events?auth_key=${this.key}&auth_timestamp=${timestamp}&auth_version=1.0&body_md5=${bodyMd5}&auth_signature=${authSignature}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pusher trigger failed: ${error}`);
    }

    return response.json();
  }

  private async hmacSha256(message: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
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

    if (!credentials.appId || !credentials.key || !credentials.secret || !credentials.cluster) {
      console.error(`[Pusher] Missing credentials for Group ${group}`);
      throw new Error(`Pusher Group ${group} credentials not configured`);
    }

    console.log(`[Pusher] Using Group ${group} for streamer: ${streamerSlug} (${streamer.streamer_name})`);
    return credentials;
  } catch (error) {
    console.error('[Pusher] Error fetching credentials:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const webhookData = await req.json()
    
    console.log('Cashfree webhook received:', JSON.stringify(webhookData, null, 2))

    // Handle Cashfree test webhooks
    if (webhookData.data?.test_object) {
      console.log('Test webhook received from Cashfree - responding with success')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Test webhook received successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Extract order information early to determine streamer
    const order_id = webhookData.data?.order?.order_id
    const order_status = webhookData.data?.order?.order_status
    const payment_status = webhookData.data?.payment?.payment_status
    const order_amount = webhookData.data?.order?.order_amount

    if (!order_id) {
      console.error('Webhook data structure:', JSON.stringify(webhookData, null, 2))
      throw new Error('Order ID not found in webhook data')
    }

    // Determine database status
    let dbStatus = 'pending'
    let moderationStatus = 'pending'
    
    if (order_status === 'PAID' || payment_status === 'SUCCESS') {
      dbStatus = 'success'
      moderationStatus = 'auto_approved'
    } else if (order_status === 'CANCELLED' || order_status === 'TERMINATED' || payment_status === 'FAILED') {
      dbStatus = 'failed'
    }

    // Determine which table to update based on order_id prefix
    const getTableName = (orderId: string) => {
      // Existing 16 streamers
      if (orderId.startsWith('ankit_')) return 'ankit_donations';
      if (orderId.startsWith('musicstream_')) return 'musicstream_donations';
      if (orderId.startsWith('techgamer_')) return 'techgamer_donations';
      if (orderId.startsWith('sizzors_')) return 'sizzors_donations';
      if (orderId.startsWith('artcreate_')) return 'artcreate_donations';
      if (orderId.startsWith('looteriya_gaming_')) return 'looteriya_gaming_donations';
      if (orderId.startsWith('demostreamer_')) return 'demostreamer_donations';
      if (orderId.startsWith('demo2_')) return 'demo2_donations';
      if (orderId.startsWith('demo3_')) return 'demo3_donations';
      if (orderId.startsWith('demo4_')) return 'demo4_donations';
      if (orderId.startsWith('chia_')) return 'chiaa_gaming_donations';
      if (orderId.startsWith('chiagaming_')) return 'chiaa_gaming_donations';
      if (orderId.startsWith('apexlegend_')) return 'apexlegend_donations';
      if (orderId.startsWith('craftmaster_')) return 'craftmaster_donations';
      if (orderId.startsWith('lofibeats_')) return 'lofibeats_donations';
      if (orderId.startsWith('valorantpro_')) return 'valorantpro_donations';
      if (orderId.startsWith('yogatime_')) return 'yogatime_donations';
      // New streamers (17-46)
      if (orderId.startsWith('streamer17_')) return 'streamer17_donations';
      if (orderId.startsWith('streamer18_')) return 'streamer18_donations';
      if (orderId.startsWith('streamer19_')) return 'streamer19_donations';
      if (orderId.startsWith('streamer20_')) return 'streamer20_donations';
      if (orderId.startsWith('streamer21_')) return 'streamer21_donations';
      if (orderId.startsWith('streamer22_')) return 'streamer22_donations';
      if (orderId.startsWith('streamer23_')) return 'streamer23_donations';
      if (orderId.startsWith('streamer24_')) return 'streamer24_donations';
      if (orderId.startsWith('streamer25_')) return 'streamer25_donations';
      if (orderId.startsWith('streamer26_')) return 'streamer26_donations';
      if (orderId.startsWith('streamer27_')) return 'streamer27_donations';
      if (orderId.startsWith('streamer28_')) return 'streamer28_donations';
      if (orderId.startsWith('streamer29_')) return 'streamer29_donations';
      if (orderId.startsWith('streamer30_')) return 'streamer30_donations';
      if (orderId.startsWith('streamer31_')) return 'streamer31_donations';
      if (orderId.startsWith('streamer32_')) return 'streamer32_donations';
      if (orderId.startsWith('streamer33_')) return 'streamer33_donations';
      if (orderId.startsWith('streamer34_')) return 'streamer34_donations';
      if (orderId.startsWith('streamer35_')) return 'streamer35_donations';
      if (orderId.startsWith('streamer36_')) return 'streamer36_donations';
      if (orderId.startsWith('streamer37_')) return 'streamer37_donations';
      if (orderId.startsWith('streamer38_')) return 'streamer38_donations';
      if (orderId.startsWith('streamer39_')) return 'streamer39_donations';
      if (orderId.startsWith('streamer40_')) return 'streamer40_donations';
      if (orderId.startsWith('streamer41_')) return 'streamer41_donations';
      if (orderId.startsWith('streamer42_')) return 'streamer42_donations';
      if (orderId.startsWith('streamer43_')) return 'streamer43_donations';
      if (orderId.startsWith('streamer44_')) return 'streamer44_donations';
      if (orderId.startsWith('streamer45_')) return 'streamer45_donations';
      if (orderId.startsWith('streamer46_')) return 'streamer46_donations';
      return 'chiaa_gaming_donations'; // default for chia_gaming
    };
    
    const tableName = getTableName(order_id);

    // Atomic update with conditional check: only update if payment_status is NOT already 'success'
    // This prevents race conditions when multiple webhooks arrive simultaneously
    const { data: updatedDonation, error: updateError } = await supabase
      .from(tableName)
      .update({ 
        payment_status: dbStatus,
        moderation_status: moderationStatus,
        approved_at: dbStatus === 'success' ? new Date().toISOString() : null,
        approved_by: dbStatus === 'success' ? 'system' : null,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', order_id)
      .neq('payment_status', 'success')  // Only update if NOT already success (race condition guard)
      .select()
      .maybeSingle()  // Use maybeSingle instead of single to handle case where no rows match

    if (updateError) {
      console.error('Database update error:', updateError)
      throw new Error('Failed to update donation record')
    }

    // If updatedDonation is null, it means the status was already 'success' (another webhook got there first)
    // Only the FIRST webhook that successfully updates the status will trigger Pusher
    const isFirstSuccess = updatedDonation !== null && dbStatus === 'success';

    console.log(`Idempotency check: order_id=${order_id}, dbStatus=${dbStatus}, isFirstSuccess=${isFirstSuccess}, updatedRecord=${updatedDonation !== null}`);

    // Map order_id prefix to correct streamer slug for Pusher channels
    const getStreamerSlug = (orderId: string): string => {
      // Existing 16 streamers
      if (orderId.startsWith('ankit_')) return 'ankit';
      if (orderId.startsWith('musicstream_')) return 'musicstream';
      if (orderId.startsWith('techgamer_')) return 'techgamer';
      if (orderId.startsWith('sizzors_')) return 'sizzors';
      if (orderId.startsWith('artcreate_')) return 'artcreate';
      if (orderId.startsWith('looteriya_gaming_')) return 'looteriya_gaming';
      if (orderId.startsWith('demostreamer_')) return 'demostreamer';
      if (orderId.startsWith('demo2_')) return 'demo2';
      if (orderId.startsWith('demo3_')) return 'demo3';
      if (orderId.startsWith('demo4_')) return 'demo4';
      if (orderId.startsWith('chia_')) return 'chiaa_gaming';
      if (orderId.startsWith('chiagaming_')) return 'chiaa_gaming';
      if (orderId.startsWith('apexlegend_')) return 'apexlegend';
      if (orderId.startsWith('craftmaster_')) return 'craftmaster';
      if (orderId.startsWith('lofibeats_')) return 'lofibeats';
      if (orderId.startsWith('valorantpro_')) return 'valorantpro';
      if (orderId.startsWith('yogatime_')) return 'yogatime';
      // New streamers (17-46)
      if (orderId.startsWith('streamer17_')) return 'streamer17';
      if (orderId.startsWith('streamer18_')) return 'streamer18';
      if (orderId.startsWith('streamer19_')) return 'streamer19';
      if (orderId.startsWith('streamer20_')) return 'streamer20';
      if (orderId.startsWith('streamer21_')) return 'streamer21';
      if (orderId.startsWith('streamer22_')) return 'streamer22';
      if (orderId.startsWith('streamer23_')) return 'streamer23';
      if (orderId.startsWith('streamer24_')) return 'streamer24';
      if (orderId.startsWith('streamer25_')) return 'streamer25';
      if (orderId.startsWith('streamer26_')) return 'streamer26';
      if (orderId.startsWith('streamer27_')) return 'streamer27';
      if (orderId.startsWith('streamer28_')) return 'streamer28';
      if (orderId.startsWith('streamer29_')) return 'streamer29';
      if (orderId.startsWith('streamer30_')) return 'streamer30';
      if (orderId.startsWith('streamer31_')) return 'streamer31';
      if (orderId.startsWith('streamer32_')) return 'streamer32';
      if (orderId.startsWith('streamer33_')) return 'streamer33';
      if (orderId.startsWith('streamer34_')) return 'streamer34';
      if (orderId.startsWith('streamer35_')) return 'streamer35';
      if (orderId.startsWith('streamer36_')) return 'streamer36';
      if (orderId.startsWith('streamer37_')) return 'streamer37';
      if (orderId.startsWith('streamer38_')) return 'streamer38';
      if (orderId.startsWith('streamer39_')) return 'streamer39';
      if (orderId.startsWith('streamer40_')) return 'streamer40';
      if (orderId.startsWith('streamer41_')) return 'streamer41';
      if (orderId.startsWith('streamer42_')) return 'streamer42';
      if (orderId.startsWith('streamer43_')) return 'streamer43';
      if (orderId.startsWith('streamer44_')) return 'streamer44';
      if (orderId.startsWith('streamer45_')) return 'streamer45';
      if (orderId.startsWith('streamer46_')) return 'streamer46';
      return 'chiaa_gaming'; // default
    };

    // If payment was successful AND this is the first success, trigger Pusher events and handle voice/TTS
    if (isFirstSuccess && updatedDonation) {
      const streamerSlug = getStreamerSlug(order_id);
      
      console.log(`Processing order: ${order_id}`);
      console.log(`Extracted streamer slug: ${streamerSlug}`);
      console.log(`Table name: ${tableName}`);
      
      // Get Pusher credentials dynamically based on streamer's group
      const pusherCreds = await getPusherCredentials(streamerSlug, supabase);
      
      // Initialize Pusher with group-specific credentials
      const pusher = new PusherClient(
        pusherCreds.appId,
        pusherCreds.key,
        pusherCreds.secret,
        pusherCreds.cluster
      );
      
      // 1. Trigger OBS alerts channel
      try {
        const alertsChannel = `${streamerSlug}-alerts`;
        console.log(`Publishing to alerts channel: ${alertsChannel}`);
        
        await pusher.trigger(alertsChannel, 'new-donation', {
          id: updatedDonation.id,
          name: updatedDonation.name,
          amount: updatedDonation.amount,
          message: updatedDonation.message,
          voice_message_url: updatedDonation.voice_message_url,
          tts_audio_url: updatedDonation.tts_audio_url,
          is_hyperemote: updatedDonation.is_hyperemote,
          created_at: updatedDonation.created_at,
          streamer_id: updatedDonation.streamer_id,
        });
        
        console.log(`✅ Pusher alerts event sent to ${alertsChannel}`);
      } catch (pusherError) {
        console.error('❌ Pusher (alerts) trigger error:', pusherError);
      }
      
      // 2. Trigger dashboard channel
      try {
        const dashboardChannel = `${streamerSlug}-dashboard`;
        console.log(`Publishing to dashboard channel: ${dashboardChannel}`);
        
        await pusher.trigger(dashboardChannel, 'new-donation', {
          id: updatedDonation.id,
          name: updatedDonation.name,
          amount: updatedDonation.amount,
          message: updatedDonation.message,
          created_at: updatedDonation.created_at,
          moderation_status: updatedDonation.moderation_status,
        });
        
        console.log(`✅ Pusher dashboard event sent to ${dashboardChannel}`);
      } catch (pusherError) {
        console.error('❌ Pusher (dashboard) trigger error:', pusherError);
      }

      // Audio channel events are now sent AFTER voice/TTS processing completes below

      // Handle voice message upload if voice data exists
      if (updatedDonation?.temp_voice_data) {
        try {
          const getVoiceUploadFunction = (orderId: string) => {
            if (orderId.startsWith('ankit_')) return 'upload-voice-message-ankit';
            if (orderId.startsWith('musicstream_')) return 'upload-voice-message-musicstream';
            if (orderId.startsWith('techgamer_')) return 'upload-voice-message-techgamer';
            if (orderId.startsWith('sizzors_')) return 'upload-voice-message-sizzors';
            if (orderId.startsWith('artcreate_')) return 'upload-voice-message-artcreate';
            if (orderId.startsWith('looteriya_gaming_')) return 'upload-voice-message-looteriya-gaming';
            if (orderId.startsWith('demostreamer_')) return 'upload-voice-message-demostreamer';
            if (orderId.startsWith('demo2_')) return 'upload-voice-message-demo2';
            if (orderId.startsWith('demo3_')) return 'upload-voice-message-demo3';
            if (orderId.startsWith('demo4_')) return 'upload-voice-message-demo4';
            if (orderId.startsWith('streamer17_')) return 'upload-voice-message-streamer17';
            if (orderId.startsWith('streamer18_')) return 'upload-voice-message-streamer18';
            if (orderId.startsWith('streamer19_')) return 'upload-voice-message-streamer19';
            if (orderId.startsWith('streamer20_')) return 'upload-voice-message-streamer20';
            if (orderId.startsWith('streamer21_')) return 'upload-voice-message-streamer21';
            if (orderId.startsWith('streamer22_')) return 'upload-voice-message-streamer22';
            if (orderId.startsWith('streamer23_')) return 'upload-voice-message-streamer23';
            if (orderId.startsWith('streamer24_')) return 'upload-voice-message-streamer24';
            if (orderId.startsWith('streamer25_')) return 'upload-voice-message-streamer25';
            return 'upload-voice-message'; // default for chia_gaming
          };
          
          const voiceUploadFunction = getVoiceUploadFunction(order_id);

          // Wait for voice message upload to complete
          const { data: voiceData, error: voiceError } = await supabase.functions.invoke(voiceUploadFunction, {
            body: { order_id }
          })

          if (voiceError) {
            console.error('Voice upload error:', voiceError)
          } else if (voiceData?.voice_message_url) {
            // Send audio event now that voice URL is ready
            try {
              const audioSlug = streamerSlug === 'chiaa_gaming' ? 'chia_gaming' : streamerSlug;
              const audioChannel = `${audioSlug}-audio`;
              console.log(`Publishing voice audio to channel: ${audioChannel}`);
              
              await pusher.trigger(audioChannel, 'new-audio-message', {
                id: updatedDonation.id,
                name: updatedDonation.name,
                amount: updatedDonation.amount,
                message: updatedDonation.message,
                voice_message_url: voiceData.voice_message_url,
                tts_audio_url: null,
                created_at: updatedDonation.created_at,
              });
              
              console.log(`✅ Pusher voice audio event sent to ${audioChannel}`);
            } catch (pusherError) {
              console.error('❌ Pusher (voice audio) trigger error:', pusherError);
            }
          }
        } catch (voiceError) {
          console.error('Voice upload trigger error:', voiceError)
        }
      }
      // Handle TTS generation for text-only donations (₹2+)
      else if (updatedDonation?.message && !updatedDonation?.tts_audio_url && updatedDonation.amount >= 2) {
        try {
          console.log('Triggering TTS generation for text donation (₹2+):', order_id)
          
          // Wait for TTS generation to complete
          const { data: ttsData, error: ttsError } = await supabase.functions.invoke('generate-donation-tts', {
            body: {
              username: updatedDonation.name,
              amount: updatedDonation.amount,
              message: updatedDonation.message,
              donationId: updatedDonation.id,
              streamerId: updatedDonation.streamer_id
            }
          })

          if (ttsError) {
            console.error('TTS generation error:', ttsError)
          } else if (ttsData?.audioUrl) {
            console.log('TTS generation completed successfully for:', order_id)
            
            // Send audio event now that TTS URL is ready
            try {
              const audioSlug = streamerSlug === 'chiaa_gaming' ? 'chia_gaming' : streamerSlug;
              const audioChannel = `${audioSlug}-audio`;
              console.log(`Publishing TTS audio to channel: ${audioChannel}`);
              
              await pusher.trigger(audioChannel, 'new-audio-message', {
                id: updatedDonation.id,
                name: updatedDonation.name,
                amount: updatedDonation.amount,
                message: updatedDonation.message,
                voice_message_url: null,
                tts_audio_url: ttsData.audioUrl,
                created_at: updatedDonation.created_at,
              });
              
              console.log(`✅ Pusher TTS audio event sent to ${audioChannel}`);
            } catch (pusherError) {
              console.error('❌ Pusher (TTS audio) trigger error:', pusherError);
            }
          }
        } catch (ttsError) {
          console.error('TTS generation trigger error:', ttsError)
        }
      }
      // Handle text-only donations below ₹70 (no TTS)
      else if (updatedDonation?.message && updatedDonation.amount < 70) {
        console.log('Text donation below ₹70 - skipping TTS generation:', order_id)
        // Donation is already sent to dashboard via line 241, no additional processing needed
      }

      // Send Telegram notification to moderators
      try {
        console.log('Sending Telegram notification to moderators for:', order_id);
        
        // Get Telegram bot token
        const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
        if (!telegramBotToken) {
          console.error('TELEGRAM_BOT_TOKEN not configured');
          throw new Error('Telegram bot token not configured');
        }

        // Get active moderators for this streamer
        const { data: moderators, error: modError } = await supabase
          .from('streamers_moderators')
          .select('telegram_user_id, mod_name')
          .eq('streamer_id', updatedDonation.streamer_id)
          .eq('is_active', true);

        if (modError) {
          console.error('Error fetching moderators:', modError);
        } else if (moderators && moderators.length > 0) {
          console.log(`Found ${moderators.length} active moderators for streamer ${updatedDonation.streamer_id}`);

          // Prepare notification message
          const messageText = `🎉 *New Donation Received!*\n\n` +
            `👤 From: *${updatedDonation.name}*\n` +
            `💰 Amount: ₹${updatedDonation.amount}\n` +
            (updatedDonation.message ? `💬 Message: "${updatedDonation.message}"\n` : '') +
            `📅 Time: ${new Date(updatedDonation.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;

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
                          url: `https://${Deno.env.get('SUPABASE_URL')?.replace('https://', '')}/dashboard/${streamerSlug}`
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
              if (updatedDonation.voice_message_url) {
                const voiceResponse = await fetch(
                  `https://api.telegram.org/bot${telegramBotToken}/sendVoice`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: mod.telegram_user_id,
                      voice: updatedDonation.voice_message_url,
                      caption: `🎤 Voice message from ${updatedDonation.name}`
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
              // Send TTS audio if available (and no voice message)
              else if (updatedDonation.tts_audio_url) {
                const audioResponse = await fetch(
                  `https://api.telegram.org/bot${telegramBotToken}/sendVoice`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: mod.telegram_user_id,
                      voice: updatedDonation.tts_audio_url,
                      caption: `🔊 TTS Audio: "${updatedDonation.message?.substring(0, 50)}..."`
                    })
                  }
                );

                if (audioResponse.ok) {
                  console.log(`✅ TTS audio sent to ${mod.mod_name}`);
                } else {
                  const errorText = await audioResponse.text();
                  console.error(`Failed to send TTS to ${mod.mod_name}:`, errorText);
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
            .eq('id', updatedDonation.id);

          if (updateNotifiedError) {
            console.error('Error updating mod_notified:', updateNotifiedError);
          } else {
            console.log(`✅ Donation ${updatedDonation.id} marked as notified`);
          }
        } else {
          console.log('No active moderators found for this streamer');
        }
      } catch (telegramError) {
        console.error('Telegram notification error:', telegramError);
        // Don't throw - we don't want to fail the webhook if Telegram fails
      }
    }

    console.log(`Payment webhook processed successfully: ${order_id} -> ${dbStatus}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        order_id,
        status: dbStatus,
        updated_donation: updatedDonation
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
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