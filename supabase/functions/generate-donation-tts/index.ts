// Updated: 2025-10-19 22:45 - Force redeploy to apply ChiaGaming table mapping fixes
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { Hash } from 'https://deno.land/x/checksum@1.4.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Permissions-Policy': 'autoplay=*, speaker=*',
  'Feature-Policy': 'autoplay *; speaker *',
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, amount, message, donationId, streamerId, isVoiceAnnouncement } = await req.json();

    if (!username || !amount) {
      throw new Error('Username and amount are required');
    }

    if (!donationId || !streamerId) {
      throw new Error('Donation ID and Streamer ID are required for storage');
    }

    const SARVAM_API_KEY = Deno.env.get('SARVAM_API_KEY');
    if (!SARVAM_API_KEY) {
      throw new Error('SARVAM_API_KEY is not configured');
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get streamer slug to determine correct table and Pusher channel
    const { data: streamerData, error: streamerError } = await supabase
      .from('streamers')
      .select('streamer_slug')
      .eq('id', streamerId)
      .single();

    if (streamerError || !streamerData) {
      console.error('Failed to fetch streamer data:', streamerError);
      throw new Error('Streamer not found');
    }

    const streamerSlug = streamerData.streamer_slug;
    console.log('Processing TTS for streamer:', streamerSlug);

    // Determine donation table name based on streamer slug
    const donationTableMap: Record<string, string> = {
      'ankit': 'ankit_donations',
      'chiaa_gaming': 'chiaa_gaming_donations',
      'techgamer': 'techgamer_donations',
      'musicstream': 'musicstream_donations',
      'artcreate': 'artcreate_donations',
      'looteriya_gaming': 'looteriya_gaming_donations',
      'demostreamer': 'demostreamer_donations',
      'sizzors': 'sizzors_donations',
      'demo2': 'demo2_donations',
      'demo3': 'demo3_donations',
      'demo4': 'demo4_donations',
      'streamer17': 'streamer17_donations',
      'streamer18': 'streamer18_donations',
      'streamer19': 'streamer19_donations',
      'streamer20': 'streamer20_donations',
      'streamer21': 'streamer21_donations',
      'streamer22': 'streamer22_donations',
      'streamer23': 'streamer23_donations',
      'streamer24': 'streamer24_donations',
      'streamer25': 'streamer25_donations',
      'damask_plays': 'damask_plays_donations',
      'neko_xenpai': 'neko_xenpai_donations',
      'thunderx': 'thunderx_donations',
      'sagarujjwalgaming': 'sagarujjwalgaming_donations',
      'notyourkween': 'notyourkween_donations',
      'bongflick': 'bongflick_donations',
      'mriqmaster': 'mriqmaster_donations',
    };

    const donationTable = donationTableMap[streamerSlug];
    if (!donationTable) {
      throw new Error(`No donation table configured for streamer: ${streamerSlug}`);
    }

    console.log('Using donation table:', donationTable);

    // Format the donation text for TTS
    let donationText: string;
    
    if (isVoiceAnnouncement) {
      // Voice message announcement: just announce the sender
      donationText = `${username} sent a Voice message`;
    } else if (message) {
      // Text message with content
      donationText = `${username} donated ${amount} rupees. ${message}`;
    } else {
      // Fallback
      donationText = `${username} donated ${amount} rupees. Thank you!`;
    }

    console.log('Generating TTS with Sarvam AI for:', donationText);

    // Detect Hindi text (Devanagari script)
    const containsHindi = /[\u0900-\u097F]/.test(donationText);
    const targetLanguage = containsHindi ? "hi-IN" : "en-IN";

    console.log('Detected language:', targetLanguage);

    // Test API key configuration
    console.log('SARVAM_API_KEY configured:', SARVAM_API_KEY ? `Yes (length: ${SARVAM_API_KEY.length})` : 'No');

    // Prepare request payload
    const requestPayload = {
      text: donationText,
      target_language_code: targetLanguage,
      speaker: "manisha",
      pitch: 0,
      pace: 0.85,
      loudness: 1.2,
      speech_sample_rate: 22050,
      enable_preprocessing: true,
      model: "bulbul:v2",
      output_audio_codec: "wav"
    };
    console.log('Sarvam AI request payload:', JSON.stringify(requestPayload));

    // Call Sarvam AI API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    console.log('Calling Sarvam AI API...');
    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      signal: controller.signal,
      method: 'POST',
      headers: {
        'API-Subscription-Key': SARVAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    clearTimeout(timeoutId);
    console.log('Sarvam AI API response received:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sarvam AI API error details:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        headers: Object.fromEntries(response.headers.entries())
      });
      throw new Error(`Sarvam AI API error: ${response.status} - ${errorText}`);
    }

    // Sarvam AI returns JSON with base64-encoded audio in the 'audios' array
    console.log('Parsing JSON response...');
    const jsonResponse = await response.json();
    console.log('JSON response structure:', {
      hasRequestId: !!jsonResponse.request_id,
      hasAudios: !!jsonResponse.audios,
      audiosLength: jsonResponse.audios?.length
    });

    if (!jsonResponse.audios || jsonResponse.audios.length === 0) {
      throw new Error('No audio data in response');
    }

    // The audio is already base64-encoded in the response
    const base64Audio = jsonResponse.audios[0];
    console.log('Base64 audio length:', base64Audio.length, 'characters');

    // Convert base64 to binary for storage upload
    const binaryAudio = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
    
    // Upload to Supabase Storage
    const storagePath = `${streamerId}/${donationId}.wav`;
    console.log('Uploading to storage:', storagePath);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('tts-audio')
      .upload(storagePath, binaryAudio, {
        contentType: 'audio/wav',
        upsert: true // Overwrite if exists
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload audio to storage: ${uploadError.message}`);
    }

    console.log('Upload successful:', uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('tts-audio')
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;
    console.log('Public URL:', publicUrl);

    // Update donation record with TTS audio URL
    const { error: updateError } = await supabase
      .from(donationTable)
      .update({ tts_audio_url: publicUrl })
      .eq('id', donationId);

    if (updateError) {
      console.error('Failed to update donation with TTS URL:', updateError);
      // Don't throw - we still have the URL
    }

    console.log('TTS generation and storage successful');

    return new Response(
      JSON.stringify({ audioUrl: publicUrl }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('TTS generation error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
