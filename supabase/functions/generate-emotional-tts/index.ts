import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Emotion configurations for ElevenLabs
const EMOTION_CONFIGS: Record<string, any> = {
  // Basic Tier
  happy: { stability: 0.5, similarity_boost: 0.7, style_exaggeration: 0.6 },
  sad: { stability: 0.8, similarity_boost: 0.6, style_exaggeration: 0.7 },
  excited: { stability: 0.3, similarity_boost: 0.7, style_exaggeration: 0.8 },
  calm: { stability: 0.9, similarity_boost: 0.8, style_exaggeration: 0.3 },
  
  // Premium Tier
  laughing: { stability: 0.2, similarity_boost: 0.8, style_exaggeration: 0.9 },
  angrily: { stability: 0.1, similarity_boost: 0.9, style_exaggeration: 1.0 },
  surprised: { stability: 0.2, similarity_boost: 0.7, style_exaggeration: 0.8 },
  whispering: { stability: 0.9, similarity_boost: 0.5, style_exaggeration: 0.4 },
  cheerful: { stability: 0.4, similarity_boost: 0.8, style_exaggeration: 0.7 },
  
  // VIP Tier
  dramatic: { stability: 0.1, similarity_boost: 0.9, style_exaggeration: 1.0 },
  villain: { stability: 0.2, similarity_boost: 0.9, style_exaggeration: 1.0 },
  mysterious: { stability: 0.7, similarity_boost: 0.6, style_exaggeration: 0.8 },
  romantic: { stability: 0.8, similarity_boost: 0.7, style_exaggeration: 0.6 },
  energetic: { stability: 0.1, similarity_boost: 0.8, style_exaggeration: 0.9 }
};

interface MessageSegment {
  text: string;
  emotion?: string;
  isEmotionTag: boolean;
}

function parseEmotionalMessage(message: string): { segments: MessageSegment[]; emotions: string[] } {
  const emotionRegex = /\[([a-zA-Z_]+)\]/g;
  const segments: MessageSegment[] = [];
  const emotions: string[] = [];
  let lastIndex = 0;
  let match;

  while ((match = emotionRegex.exec(message)) !== null) {
    const [fullMatch, emotionName] = match;
    const startIndex = match.index;
    
    // Add text before emotion tag (if any)
    if (startIndex > lastIndex) {
      const beforeText = message.slice(lastIndex, startIndex);
      if (beforeText.trim()) {
        segments.push({
          text: beforeText.trim(),
          isEmotionTag: false
        });
      }
    }
    
    // Add emotion tag if it's a valid emotion
    if (EMOTION_CONFIGS[emotionName.toLowerCase()]) {
      const emotion = emotionName.toLowerCase();
      segments.push({
        text: fullMatch,
        emotion,
        isEmotionTag: true
      });
      if (!emotions.includes(emotion)) {
        emotions.push(emotion);
      }
    } else {
      // Invalid emotion tag, treat as regular text
      segments.push({
        text: fullMatch,
        isEmotionTag: false
      });
    }
    
    lastIndex = startIndex + fullMatch.length;
  }
  
  // Add remaining text
  if (lastIndex < message.length) {
    const remainingText = message.slice(lastIndex);
    if (remainingText.trim()) {
      segments.push({
        text: remainingText.trim(),
        isEmotionTag: false
      });
    }
  }
  
  return { segments, emotions };
}

async function generateTTSSegment(
  text: string, 
  emotion: string | undefined, 
  voiceId: string,
  elevenLabsApiKey: string
): Promise<ArrayBuffer> {
  const settings = emotion ? EMOTION_CONFIGS[emotion] : {
    stability: 0.5,
    similarity_boost: 0.8,
    style_exaggeration: 0.5
  };

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': elevenLabsApiKey
    },
    body: JSON.stringify({
      text: text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: settings.stability,
        similarity_boost: settings.similarity_boost,
        style: settings.style_exaggeration,
        use_speaker_boost: true
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
  }

  return await response.arrayBuffer();
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
    const { segments, emotions } = parseEmotionalMessage(message);
    console.log(`Found emotions: ${emotions.join(', ')}`);
    console.log(`Message segments: ${segments.length}`);

    // Generate TTS for each segment
    const audioSegments = [];
    const segmentMetadata = [];

    for (const segment of segments) {
      if (segment.isEmotionTag) {
        // Skip emotion tags themselves, they're just markers
        continue;
      }

      // Find the next emotion tag to apply to this text segment
      let currentEmotion: string | undefined;
      const segmentIndex = segments.indexOf(segment);
      
      // Look backwards for the most recent emotion tag
      for (let i = segmentIndex - 1; i >= 0; i--) {
        if (segments[i].isEmotionTag && segments[i].emotion) {
          currentEmotion = segments[i].emotion;
          break;
        }
      }

      console.log(`Generating TTS for: "${segment.text}" with emotion: ${currentEmotion || 'neutral'}`);
      
      const audioBuffer = await generateTTSSegment(
        segment.text,
        currentEmotion,
        voiceId,
        elevenLabsApiKey
      );

      audioSegments.push(audioBuffer);
      segmentMetadata.push({
        text: segment.text,
        emotion: currentEmotion || 'neutral',
        duration_estimate: Math.ceil(segment.text.length * 0.1) // Rough estimate
      });
    }

    console.log(`Generated ${audioSegments.length} TTS segments`);

    // For now, we'll use the first segment as the main audio
    // In a production setup, you'd want to concatenate all segments
    const mainAudioBuffer = audioSegments[0];

    if (!mainAudioBuffer) {
      throw new Error('No audio segments generated');
    }

    // Upload to Supabase Storage
    const fileName = `ankit_tts_${donationId}_${Date.now()}.mp3`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('voice-messages')
      .upload(fileName, mainAudioBuffer, {
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

    // Determine emotion tier
    let emotionTier = 'basic';
    if (amount >= 100) emotionTier = 'vip';
    else if (amount >= 25) emotionTier = 'premium';

    // Update donation with TTS results
    const { error: updateError } = await supabase
      .from('ankit_donations')
      .update({
        tts_audio_url: publicUrl,
        emotion_tags: emotions,
        emotion_tier: emotionTier,
        tts_segments: segmentMetadata,
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
        emotionTier: emotionTier,
        segmentCount: audioSegments.length
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