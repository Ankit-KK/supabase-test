import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import Pusher from 'https://esm.sh/pusher@5.1.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Permissions-Policy': 'autoplay=*, speaker=*',
  'Feature-Policy': 'autoplay *; speaker *',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, amount, message, donationId, streamerId } = await req.json();

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

    // Format the donation announcement
    const donationText = message 
      ? `${username} donated ${amount} rupees. ${message}`
      : `${username} donated ${amount} rupees. Thank you!`;

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
      pace: 1.1,
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
      .from('ankit_donations')
      .update({ tts_audio_url: publicUrl })
      .eq('id', donationId);

    if (updateError) {
      console.error('Failed to update donation with TTS URL:', updateError);
      // Don't throw - we still have the URL
    }

    console.log('TTS generation and storage successful');

    // Re-query to get complete updated donation record
    const { data: finalDonation } = await supabase
      .from('ankit_donations')
      .select('*')
      .eq('id', donationId)
      .single();

    if (finalDonation) {
      // Initialize Pusher and trigger audio event
      try {
        const pusher = new Pusher({
          appId: Deno.env.get('PUSHER_APP_ID')!,
          key: '5adfbac388b9dfa055c0',
          secret: Deno.env.get('PUSHER_SECRET')!,
          cluster: 'ap2',
          useTLS: true,
        });

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
        console.log(`Pusher audio event triggered for donation ${donationId} on channel ${audioChannel}`);
      } catch (pusherError) {
        console.error('Pusher audio trigger error:', pusherError);
      }
    }

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
