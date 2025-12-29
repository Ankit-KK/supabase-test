// Updated: 2025-12-29 - Removed moderation system, all donations auto-approved
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import { Hash } from 'https://deno.land/x/checksum@1.4.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Exchange rates to INR for TTS threshold conversion
const EXCHANGE_RATES_TO_INR: Record<string, number> = {
  'INR': 1, 'USD': 89, 'EUR': 94, 'GBP': 113, 'AED': 24, 'AUD': 57
};

const convertToINR = (amount: number, currency: string): number => {
  return amount * (EXCHANGE_RATES_TO_INR[currency] || 1);
};

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

    // Determine database status - ALL DONATIONS AUTO-APPROVED
    let dbStatus = 'pending'
    let moderationStatus = 'auto_approved' // Always auto-approve
    
    if (order_status === 'PAID' || payment_status === 'SUCCESS') {
      dbStatus = 'success'
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
      if (orderId.startsWith('damask_plays_')) return 'damask_plays_donations';
      if (orderId.startsWith('neko_xenpai_')) return 'neko_xenpai_donations';
      if (orderId.startsWith('thunderx_')) return 'thunderx_donations';
      return 'chiaa_gaming_donations'; // default for chia_gaming
    };
    
    const tableName = getTableName(order_id);

    // Atomic update with conditional check: only update if payment_status is NOT already 'success'
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
      .neq('payment_status', 'success')
      .select()
      .maybeSingle()

    if (updateError) {
      console.error('Database update error:', updateError)
      throw new Error('Failed to update donation record')
    }

    // If updatedDonation is null, it means the status was already 'success'
    const isFirstSuccess = updatedDonation !== null && dbStatus === 'success';

    console.log(`Idempotency check: order_id=${order_id}, dbStatus=${dbStatus}, isFirstSuccess=${isFirstSuccess}`);

    // Map order_id prefix to correct streamer slug for Pusher channels
    const getStreamerSlug = (orderId: string): string => {
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
      if (orderId.startsWith('damask_plays_')) return 'damask_plays';
      if (orderId.startsWith('neko_xenpai_')) return 'neko_xenpai';
      if (orderId.startsWith('thunderx_')) return 'thunderx';
      return 'chiaa_gaming';
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
      
      // 1. ALWAYS trigger OBS alerts channel immediately (no moderation)
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
      
      // 2. Trigger dashboard channel for real-time updates
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

      // NEW DONATION LOGIC - Only for specific streamers with TTS
      const isNewStreamer = ['looteriya_gaming', 'chiaa_gaming', 'sizzors', 'damask_plays', 'neko_xenpai'].includes(streamerSlug);
      
      if (isNewStreamer) {
        // 1. HYPEREMOTES - NO TTS, just visual effects
        if (updatedDonation.is_hyperemote) {
          console.log('Hyperemote donation - skipping TTS, visual alert only:', order_id);
        }
        
        // 2. VOICE MESSAGES - Generate announcement TTS + play voice
        else if (updatedDonation.voice_message_url) {
          console.log('Voice message donation - generating announcement TTS:', order_id);
          
          try {
            const { data: announcementTTS, error: announcementError } = await supabase.functions.invoke('generate-donation-tts', {
              body: {
                username: updatedDonation.name,
                amount: updatedDonation.amount,
                message: null,
                donationId: updatedDonation.id,
                streamerId: updatedDonation.streamer_id,
                isVoiceAnnouncement: true
              }
            });
            
            if (announcementError) {
              console.error('Announcement TTS generation error:', announcementError);
            } else if (announcementTTS?.audioUrl) {
              console.log('Announcement TTS generated successfully, sending to audio channel');
              
              const audioSlug = streamerSlug === 'chiaa_gaming' ? 'chia_gaming' : streamerSlug;
              const audioChannel = `${audioSlug}-audio`;
              
              await pusher.trigger(audioChannel, 'new-audio-message', {
                id: updatedDonation.id,
                name: updatedDonation.name,
                amount: updatedDonation.amount,
                message: null,
                announcement_tts_url: announcementTTS.audioUrl,
                voice_message_url: updatedDonation.voice_message_url,
                tts_audio_url: null,
                created_at: updatedDonation.created_at,
              });
              
              console.log(`✅ Voice message with announcement sent to ${audioChannel}`);
            }
          } catch (error) {
            console.error('Voice message announcement error:', error);
          }
        }
        
        // 3. TEXT MESSAGES - Conditional TTS based on amount (converted to INR)
        else if (updatedDonation.message) {
          const donationCurrency = updatedDonation.currency || 'INR';
          const amountInINR = convertToINR(updatedDonation.amount, donationCurrency);
          
          // ₹40-69 (INR equivalent): Display only, NO TTS
          if (amountInINR >= 40 && amountInINR < 70) {
            console.log(`Text donation ${donationCurrency} ${updatedDonation.amount} (₹${amountInINR}) - displaying without TTS:`, order_id);
          }
          
          // ₹70+ (INR equivalent): Display + Generate TTS
          else if (amountInINR >= 70) {
            console.log(`Text donation ${donationCurrency} ${updatedDonation.amount} (₹${amountInINR}) - generating TTS:`, order_id);
            
            try {
              const { data: ttsData, error: ttsError } = await supabase.functions.invoke('generate-donation-tts', {
                body: {
                  username: updatedDonation.name,
                  amount: updatedDonation.amount,
                  message: updatedDonation.message,
                  donationId: updatedDonation.id,
                  streamerId: updatedDonation.streamer_id
                }
              });
              
              if (ttsError) {
                console.error('TTS generation error:', ttsError);
              } else if (ttsData?.audioUrl) {
                console.log('TTS generated successfully, updating donation and sending to audio channel');
                
                await supabase
                  .from(tableName)
                  .update({ tts_audio_url: ttsData.audioUrl })
                  .eq('id', updatedDonation.id);
                
                const audioSlug = streamerSlug === 'chiaa_gaming' ? 'chia_gaming' : streamerSlug;
                const audioChannel = `${audioSlug}-audio`;
                
                await pusher.trigger(audioChannel, 'new-audio-message', {
                  id: updatedDonation.id,
                  name: updatedDonation.name,
                  amount: updatedDonation.amount,
                  message: updatedDonation.message,
                  announcement_tts_url: null,
                  voice_message_url: null,
                  tts_audio_url: ttsData.audioUrl,
                  created_at: updatedDonation.created_at,
                });
                
                console.log(`✅ TTS audio sent to ${audioChannel}`);
              }
            } catch (error) {
              console.error('TTS generation error:', error);
            }
          }
          // Under ₹40: No TTS
          else {
            console.log(`Text donation ₹${amountInINR} below threshold - no TTS:`, order_id);
          }
        }
        
        // 4. NO MESSAGE - Just alert, no TTS
        else {
          console.log('No message donation - alert only, no TTS:', order_id);
        }
      }
      // For other streamers, use original logic
      else {
        // Original TTS logic for ankit and other streamers
        if (updatedDonation.message && !updatedDonation.is_hyperemote && !updatedDonation.voice_message_url) {
          console.log('Generating TTS for text message:', order_id);
          try {
            const { data: ttsData, error: ttsError } = await supabase.functions.invoke('generate-donation-tts', {
              body: {
                username: updatedDonation.name,
                amount: updatedDonation.amount,
                message: updatedDonation.message,
                donationId: updatedDonation.id,
                streamerId: updatedDonation.streamer_id
              }
            });
            
            if (ttsError) {
              console.error('TTS generation error:', ttsError);
            } else if (ttsData?.audioUrl) {
              await supabase
                .from(tableName)
                .update({ tts_audio_url: ttsData.audioUrl })
                .eq('id', updatedDonation.id);
              console.log('TTS audio saved successfully');
            }
          } catch (error) {
            console.error('TTS invocation error:', error);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        order_id,
        status: dbStatus,
        was_first_update: isFirstSuccess
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Cashfree webhook error:', error)
    
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
