import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Hash } from 'https://deno.land/x/checksum@1.4.0/mod.ts'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();
    
    if (!order_id) {
      throw new Error("Order ID is required");
    }

    // Create Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the donation record with temp voice data (handle race conditions)
    const { data: donation, error: fetchError } = await supabaseAdmin
      .from('ankit_donations')
      .select('*')
      .eq('order_id', order_id)
      .eq('payment_status', 'success')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !donation) {
      throw new Error(`Donation not found or payment not successful: ${fetchError?.message}`);
    }

    if (!donation.temp_voice_data) {
      console.log('No voice data to upload for order:', order_id);
      return new Response(
        JSON.stringify({ success: true, message: "No voice data to upload" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert base64 back to blob
    const binaryString = atob(donation.temp_voice_data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const audioBlob = new Blob([bytes], { type: 'audio/webm' });
    
    // Upload to voice-messages bucket
    const fileName = `${order_id}_voice_message.webm`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('voice-messages')
      .upload(fileName, audioBlob, {
        contentType: 'audio/webm',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('voice-messages')
      .getPublicUrl(fileName);

    // Update donation record with voice URL and clear temp data
    const { error: updateError } = await supabaseAdmin
      .from('ankit_donations')
      .update({ 
        voice_message_url: publicUrl,
        temp_voice_data: null // Clear temp data to save space
      })
      .eq('order_id', order_id);

    if (updateError) {
      throw new Error(`Failed to update donation record: ${updateError.message}`);
    }

    console.log('Voice message uploaded successfully for order:', order_id, 'URL:', publicUrl);

    // Re-query to get complete updated donation record
    const { data: finalDonation } = await supabaseAdmin
      .from('ankit_donations')
      .select('*')
      .eq('order_id', order_id)
      .single();

    if (finalDonation) {
      // Initialize Pusher and trigger audio event
      try {
        // Get Pusher credentials from Supabase secrets (required)
        const pusherAppId = Deno.env.get('PUSHER_APP_ID');
        const pusherKey = Deno.env.get('PUSHER_KEY');
        const pusherSecret = Deno.env.get('PUSHER_SECRET');
        const pusherCluster = Deno.env.get('PUSHER_CLUSTER');

        if (!pusherAppId || !pusherKey || !pusherSecret || !pusherCluster) {
          console.error('Missing Pusher credentials in environment variables');
          throw new Error('Pusher configuration incomplete - check Supabase secrets');
        }

        const pusher = new PusherClient(
          pusherAppId,
          pusherKey,
          pusherSecret,
          pusherCluster
        );

        const audioChannel = 'ankit-audio';
        await pusher.trigger(audioChannel, 'new-audio-message', {
          id: finalDonation.id,
          name: finalDonation.name,
          amount: finalDonation.amount,
          message: finalDonation.message,
          voice_message_url: finalDonation.voice_message_url,
          tts_audio_url: finalDonation.tts_audio_url,
          created_at: finalDonation.created_at,
          is_hyperemote: finalDonation.is_hyperemote,
          moderation_status: finalDonation.moderation_status,
          payment_status: finalDonation.payment_status,
          streamer_id: finalDonation.streamer_id,
        });
        console.log(`Pusher audio event triggered for ${order_id} on channel ${audioChannel}`);
      } catch (pusherError) {
        console.error('Pusher audio trigger error:', pusherError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        voice_message_url: publicUrl,
        message: "Voice message uploaded successfully" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Voice upload error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});