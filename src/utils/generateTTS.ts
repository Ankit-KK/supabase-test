import { supabase } from '@/integrations/supabase/client';

interface TTSGenerationResult {
  audioUrl: string | null;
  error?: string;
}

const ttsCache = new Map<string, string>();

export async function generateTTS(
  donorName: string,
  amount: number,
  message?: string
): Promise<TTSGenerationResult> {
  try {
    // Create cache key
    const cacheKey = `${donorName}-${amount}-${message || ''}`;
    
    // Check cache first
    if (ttsCache.has(cacheKey)) {
      return { audioUrl: ttsCache.get(cacheKey)! };
    }

    // Limit message length
    const limitedMessage = message ? message.substring(0, 500) : undefined;

    // Call edge function
    const { data, error } = await supabase.functions.invoke('generate-donation-tts', {
      body: {
        username: donorName,
        amount,
        message: limitedMessage,
      },
    });

    if (error) {
      console.error('TTS generation error:', error);
      return { audioUrl: null, error: error.message };
    }

    if (!data?.audioContent) {
      return { audioUrl: null, error: 'No audio content returned' };
    }

    // Convert base64 to data URL (no need for blob URL management)
    const dataUrl = `data:audio/x-wav;base64,${data.audioContent}`;

    // Cache the result
    ttsCache.set(cacheKey, dataUrl);

    return { audioUrl: dataUrl };
  } catch (error) {
    console.error('Error generating TTS:', error);
    return { 
      audioUrl: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export function cleanupTTSCache() {
  // Data URLs don't need revocation, just clear the cache
  ttsCache.clear();
}
