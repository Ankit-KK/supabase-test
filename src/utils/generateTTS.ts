import { supabase } from '@/integrations/supabase/client';

interface TTSGenerationResult {
  audioUrl: string | null;
  error?: string;
}

const ttsCache = new Map<string, string>();

export async function generateTTS(
  donorName: string,
  amount: number,
  message?: string,
  donationId?: string,
  streamerId?: string
): Promise<TTSGenerationResult> {
  try {
    // Create cache key
    const cacheKey = `${donorName}-${amount}-${message || ''}`;
    
    // Check cache first
    if (ttsCache.has(cacheKey)) {
      return { audioUrl: ttsCache.get(cacheKey)! };
    }

    if (!donationId || !streamerId) {
      return { audioUrl: null, error: 'Donation ID and Streamer ID are required' };
    }

    // Limit message length
    const limitedMessage = message ? message.substring(0, 500) : undefined;

    // Call edge function with storage parameters
    const { data, error } = await supabase.functions.invoke('generate-donation-tts', {
      body: {
        username: donorName,
        amount,
        message: limitedMessage,
        donationId,
        streamerId,
      },
    });

    if (error) {
      console.error('TTS generation error:', error);
      return { audioUrl: null, error: error.message };
    }

    if (!data?.audioUrl) {
      return { audioUrl: null, error: 'No audio URL returned' };
    }

    // Cache the storage URL
    ttsCache.set(cacheKey, data.audioUrl);

    return { audioUrl: data.audioUrl };
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
