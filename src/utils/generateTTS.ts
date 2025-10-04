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

    // Convert base64 to blob URL
    const audioBlob = base64ToBlob(data.audioContent, 'audio/x-wav');
    const blobUrl = URL.createObjectURL(audioBlob);

    // Cache the result
    ttsCache.set(cacheKey, blobUrl);

    return { audioUrl: blobUrl };
  } catch (error) {
    console.error('Error generating TTS:', error);
    return { 
      audioUrl: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

function base64ToBlob(base64: string, contentType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}

export function cleanupTTSCache() {
  ttsCache.forEach((url) => {
    URL.revokeObjectURL(url);
  });
  ttsCache.clear();
}
