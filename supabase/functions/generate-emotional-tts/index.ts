import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { ElevenLabsClient } from 'https://esm.sh/@elevenlabs/elevenlabs-js@2.13.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supported emotions for eleven_v3 model
const SUPPORTED_EMOTIONS = [
  'happy', 'sad', 'excited', 'calm', 'laughing', 'angrily', 'surprised', 
  'whispering', 'cheerful', 'dramatic', 'villain', 'mysterious', 'romantic', 
  'energetic', 'nervous', 'confused', 'thoughtful', 'sarcastic', 'bored'
];

function parseEmotionalMessage(message: string): { processedMessage: string; emotions: string[] } {
  const emotionRegex = /\[([a-zA-Z_]+)\]/g;
  const emotions: string[] = [];
  let match;

  // Extract all emotions from the message
  while ((match = emotionRegex.exec(message)) !== null) {
    const emotionName = match[1].toLowerCase();
    if (SUPPORTED_EMOTIONS.includes(emotionName) && !emotions.includes(emotionName)) {
      emotions.push(emotionName);
    }
  }

  // The message is already in the correct format for eleven_v3 model
  // It expects inline emotion tags like [cheerfully] Hello there!
  return { processedMessage: message, emotions };
}

async function generateEmotionalTTS(
  message: string,
  voiceId: string,
  elevenLabsApiKey: string
): Promise<ArrayBuffer> {
  const elevenlabs = new ElevenLabsClient({
    apiKey: elevenLabsApiKey
  });

  console.log(`Generating TTS with eleven_v3 model for message: "${message}"`);
  
  const audio = await elevenlabs.textToDialogue.convert({
    inputs: [
      {
        text: message,
        voiceId: voiceId,
      }
    ],
    model: "eleven_v3"
  });

  // Convert the audio stream to ArrayBuffer
  const chunks: Uint8Array[] = [];
  const reader = audio.getReader();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  // Combine all chunks into a single ArrayBuffer
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result.buffer;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      donationId, 
      message, 
      donorName, 
      amount,
      voiceId = "H6QPv2pQZDcGqLwDTIJQ" // Default to Aria voice
    } = await req.json();

    if (!donationId || !message) {
      throw new Error('Missing required fields: donationId and message');
    }

    console.log(`Processing emotional TTS for donation ${donationId}: "${message}"`);

    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenLabsApiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update processing status
    await supabase
      .from('ankit_donations')
      .update({ processing_status: 'processing' })
      .eq('id', donationId);

    // Parse message for emotions
    const { processedMessage, emotions } = parseEmotionalMessage(message);
    console.log(`Found emotions: ${emotions.join(', ')}`);
    console.log(`Processing message: "${processedMessage}"`);

    // Generate TTS using eleven_v3 model with inline emotion tags
    const audioBuffer = await generateEmotionalTTS(
      processedMessage,
      voiceId,
      elevenLabsApiKey
    );

    console.log(`Generated emotional TTS audio`);

    if (!audioBuffer) {
      throw new Error('No audio generated');
    }

    // Upload to Supabase Storage
    const fileName = `ankit_tts_${donationId}_${Date.now()}.mp3`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('voice-messages')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload audio: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('voice-messages')
      .getPublicUrl(fileName);

    // Determine emotion tier - For testing, all emotions available for 1 rupee
    let emotionTier = 'vip'; // Always set to VIP for testing

    // Update donation with TTS results
    const { error: updateError } = await supabase
      .from('ankit_donations')
      .update({
        tts_audio_url: publicUrl,
        emotion_tags: emotions,
        emotion_tier: emotionTier,
        processing_status: 'completed'
      })
      .eq('id', donationId);

    if (updateError) {
      throw new Error(`Failed to update donation: ${updateError.message}`);
    }

    console.log(`Emotional TTS completed for donation ${donationId}`);

    return new Response(
      JSON.stringify({
        success: true,
        audioUrl: publicUrl,
        emotions: emotions,
        emotionTier: emotionTier
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in generate-emotional-tts:', error);

    // Try to update donation status to failed if we have donationId
    try {
      const body = await req.json();
      if (body.donationId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from('ankit_donations')
          .update({ processing_status: 'failed' })
          .eq('id', body.donationId);
      }
    } catch (e) {
      console.error('Failed to update donation status:', e);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});