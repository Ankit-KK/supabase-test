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

    // Get Pusher credentials from Supabase secrets (required)
    const pusherAppId = Deno.env.get('PUSHER_APP_ID');
    const pusherKey = Deno.env.get('PUSHER_KEY');
    const pusherSecret = Deno.env.get('PUSHER_SECRET');
    const pusherCluster = Deno.env.get('PUSHER_CLUSTER');

    if (!pusherAppId || !pusherKey || !pusherSecret || !pusherCluster) {
      console.error('Missing Pusher credentials in environment variables');
      throw new Error('Pusher configuration incomplete - check Supabase secrets');
    }

    // Initialize Pusher client
    const pusher = new PusherClient(
      pusherAppId,
      pusherKey,
      pusherSecret,
      pusherCluster
    );

    // Extract order information from webhook - Cashfree sends data nested under 'data'
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
      if (orderId.startsWith('ankit_')) return 'ankit_donations';
      if (orderId.startsWith('musicstream_')) return 'musicstream_donations';
      if (orderId.startsWith('techgamer_')) return 'techgamer_donations';
      if (orderId.startsWith('fitnessflow_')) return 'fitnessflow_donations';
      if (orderId.startsWith('artcreate_')) return 'artcreate_donations';
      if (orderId.startsWith('codelive_')) return 'codelive_donations';
      if (orderId.startsWith('demostreamer_')) return 'demostreamer_donations';
      if (orderId.startsWith('demo2_')) return 'demo2_donations';
      if (orderId.startsWith('demo3_')) return 'demo3_donations';
      if (orderId.startsWith('demo4_')) return 'demo4_donations';
      if (orderId.startsWith('chia_')) return 'chiaa_gaming_donations';
      if (orderId.startsWith('chiagaming_')) return 'chiaa_gaming_donations';
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
      if (orderId.startsWith('ankit_')) return 'ankit';
      if (orderId.startsWith('musicstream_')) return 'musicstream';
      if (orderId.startsWith('techgamer_')) return 'techgamer';
      if (orderId.startsWith('fitnessflow_')) return 'fitnessflow';
      if (orderId.startsWith('artcreate_')) return 'artcreate';
      if (orderId.startsWith('codelive_')) return 'codelive';
      if (orderId.startsWith('demostreamer_')) return 'demostreamer';
      if (orderId.startsWith('demo2_')) return 'demo2';
      if (orderId.startsWith('demo3_')) return 'demo3';
      if (orderId.startsWith('demo4_')) return 'demo4';
      if (orderId.startsWith('chia_')) return 'chiaa_gaming';
      if (orderId.startsWith('chiagaming_')) return 'chiaa_gaming';  // Fix for ChiaGaming
      return 'chiaa_gaming'; // default
    };

    // If payment was successful AND this is the first success, trigger Pusher events and handle voice/TTS
    if (isFirstSuccess && updatedDonation) {
      const streamerSlug = getStreamerSlug(order_id);
      
      console.log(`Processing order: ${order_id}`);
      console.log(`Extracted streamer slug: ${streamerSlug}`);
      console.log(`Table name: ${tableName}`);
      
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
            if (orderId.startsWith('fitnessflow_')) return 'upload-voice-message-fitnessflow';
            if (orderId.startsWith('artcreate_')) return 'upload-voice-message-artcreate';
            if (orderId.startsWith('codelive_')) return 'upload-voice-message-codelive';
            if (orderId.startsWith('demostreamer_')) return 'upload-voice-message-demostreamer';
            if (orderId.startsWith('demo2_')) return 'upload-voice-message-demo2';
            if (orderId.startsWith('demo3_')) return 'upload-voice-message-demo3';
            if (orderId.startsWith('demo4_')) return 'upload-voice-message-demo4';
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
      // Handle TTS generation for text-only donations (₹70+)
      else if (updatedDonation?.message && !updatedDonation?.tts_audio_url && updatedDonation.amount >= 70) {
        try {
          console.log('Triggering TTS generation for text donation (₹70+):', order_id)
          
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