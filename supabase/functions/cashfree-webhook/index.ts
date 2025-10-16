import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

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
    
    const authString = `POST\n/apps/${this.appId}/events\nauth_key=${this.key}&auth_timestamp=${timestamp}&auth_version=1.0`;
    const authSignature = await this.hmacSha256(authString, this.secret);
    
    const url = `https://api-${this.cluster}.pusher.com/apps/${this.appId}/events?auth_key=${this.key}&auth_timestamp=${timestamp}&auth_version=1.0&auth_signature=${authSignature}`;
    
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Initialize Pusher client
    const pusher = new PusherClient(
      Deno.env.get('PUSHER_APP_ID') || '2064489',
      Deno.env.get('PUSHER_KEY') || '5adfbac388b9dfa055c0',
      Deno.env.get('PUSHER_SECRET') || 'de2c5b68db09285c0dba',
      Deno.env.get('PUSHER_CLUSTER') || 'ap2'
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
      if (orderId.startsWith('artcreate_')) return 'chia_gaming_donations';
      if (orderId.startsWith('codelive_')) return 'chia_gaming_donations';
      if (orderId.startsWith('demostreamer_')) return 'demostreamer_donations';
      return 'chia_gaming_donations'; // default for chia_gaming
    };
    
    const tableName = getTableName(order_id);

    // Update the donation record
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
      .select()
      .single()

    if (updateError) {
      console.error('Database update error:', updateError)
      throw new Error('Failed to update donation record')
    }

    // If payment was successful, trigger Pusher event and handle voice/TTS
    if (dbStatus === 'success' && updatedDonation) {
      // Trigger Pusher event for real-time alerts
      try {
        const channelName = order_id.startsWith('ankit_') ? 'ankit-alerts' : 'donation-alerts';
        
        await pusher.trigger(channelName, 'new-donation', {
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
        
        console.log(`Pusher event triggered for ${order_id} on channel ${channelName}`);
      } catch (pusherError) {
        console.error('Pusher trigger error:', pusherError);
        // Don't fail the webhook if Pusher fails
      }

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
            return 'upload-voice-message'; // default for chia_gaming
          };
          
          const voiceUploadFunction = getVoiceUploadFunction(order_id);

          // Trigger voice message upload
          const { error: voiceError } = await supabase.functions.invoke(voiceUploadFunction, {
            body: { order_id }
          })

          if (voiceError) {
            console.error('Voice upload error:', voiceError)
          }
        } catch (voiceError) {
          console.error('Voice upload trigger error:', voiceError)
        }
      }
      // Handle TTS generation for text-only donations
      else if (updatedDonation?.message && !updatedDonation?.tts_audio_url) {
        try {
          console.log('Triggering TTS generation for text donation:', order_id)
          
          const { error: ttsError } = await supabase.functions.invoke('generate-donation-tts', {
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
          } else {
            console.log('TTS generation triggered successfully for:', order_id)
          }
        } catch (ttsError) {
          console.error('TTS generation trigger error:', ttsError)
        }
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