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
      if (orderId.startsWith('ankit_')) return 'ankit_donations';
      if (orderId.startsWith('sizzors_')) return 'sizzors_donations';
      if (orderId.startsWith('looteriya_gaming_')) return 'looteriya_gaming_donations';
      if (orderId.startsWith('chia_')) return 'chiaa_gaming_donations';
      if (orderId.startsWith('chiagaming_')) return 'chiaa_gaming_donations';
      if (orderId.startsWith('damask_plays_')) return 'damask_plays_donations';
      if (orderId.startsWith('neko_xenpai_')) return 'neko_xenpai_donations';
      if (orderId.startsWith('thunderx_')) return 'thunderx_donations';
      if (orderId.startsWith('vipbhai_')) return 'vipbhai_donations';
      if (orderId.startsWith('sagarujjwalgaming_')) return 'sagarujjwalgaming_donations';
      if (orderId.startsWith('notyourkween_')) return 'notyourkween_donations';
      if (orderId.startsWith('bongflick_')) return 'bongflick_donations';
      if (orderId.startsWith('mriqmaster_')) return 'mriqmaster_donations';
      if (orderId.startsWith('abdevil_')) return 'abdevil_donations';
      if (orderId.startsWith('jhanvoo_')) return 'jhanvoo_donations';
      if (orderId.startsWith('clumsygod_')) return 'clumsygod_donations';
      if (orderId.startsWith('jimmy_gaming_')) return 'jimmy_gaming_donations';
      return 'chiaa_gaming_donations'; // default
    };
    
    const tableName = getTableName(order_id);

    // First, fetch the donation to check its type for delay calculation
    const { data: donationCheck, error: checkError } = await supabase
      .from(tableName)
      .select('hypersound_url')
      .eq('order_id', order_id)
      .maybeSingle();

    // Calculate audio_scheduled_at based on donation type (15s for hypersound, 60s for others)
    const audioDelay = donationCheck?.hypersound_url ? 15000 : 60000;
    const audioScheduledAt = new Date(Date.now() + audioDelay).toISOString();

    // Atomic update with conditional check: only update if payment_status is NOT already 'success'
    const { data: updatedDonation, error: updateError } = await supabase
      .from(tableName)
      .update({ 
        payment_status: dbStatus,
        moderation_status: moderationStatus,
        approved_at: dbStatus === 'success' ? new Date().toISOString() : null,
        approved_by: dbStatus === 'success' ? 'system' : null,
        updated_at: new Date().toISOString(),
        audio_scheduled_at: dbStatus === 'success' ? audioScheduledAt : null
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

    console.log(`Idempotency check: order_id=${order_id}, dbStatus=${dbStatus}, isFirstSuccess=${isFirstSuccess}, audioScheduledAt=${audioScheduledAt}`);

    // Map order_id prefix to correct streamer slug for Pusher channels
    const getStreamerSlug = (orderId: string): string => {
      if (orderId.startsWith('ankit_')) return 'ankit';
      if (orderId.startsWith('sizzors_')) return 'sizzors';
      if (orderId.startsWith('looteriya_gaming_')) return 'looteriya_gaming';
      if (orderId.startsWith('chia_')) return 'chiaa_gaming';
      if (orderId.startsWith('chiagaming_')) return 'chiaa_gaming';
      if (orderId.startsWith('damask_plays_')) return 'damask_plays';
      if (orderId.startsWith('neko_xenpai_')) return 'neko_xenpai';
      if (orderId.startsWith('thunderx_')) return 'thunderx';
      if (orderId.startsWith('vipbhai_')) return 'vipbhai';
      if (orderId.startsWith('sagarujjwalgaming_')) return 'sagarujjwalgaming';
      if (orderId.startsWith('notyourkween_')) return 'notyourkween';
      if (orderId.startsWith('bongflick_')) return 'bongflick';
      if (orderId.startsWith('mriqmaster_')) return 'mriqmaster';
      if (orderId.startsWith('abdevil_')) return 'abdevil';
      if (orderId.startsWith('jhanvoo_')) return 'jhanvoo';
      if (orderId.startsWith('clumsygod_')) return 'clumsygod';
      if (orderId.startsWith('jimmy_gaming_')) return 'jimmy_gaming';
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
      
      // Do NOT send immediate alerts to OBS - visual alert + audio will be triggered by get-current-audio
      // after the 60-second fraud protection delay has passed. This ensures sync between audio and visuals.
      console.log(`✅ Auto-approved donation - audio scheduled at ${audioScheduledAt}, NOT sending immediate OBS alert`);
      
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
