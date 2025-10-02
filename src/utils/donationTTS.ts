import { supabase } from "@/integrations/supabase/client";

/**
 * Converts base64 string to Blob
 */
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

/**
 * Generate and play TTS for donation announcement
 * @param username - Name of the donor
 * @param amount - Donation amount
 * @param message - Optional donation message
 * @param voiceId - ElevenLabs voice ID (defaults to Kanika voice)
 */
export const generateAndPlayTTS = async (
  username: string,
  amount: number,
  message?: string,
  voiceId: string = 'H6QPv2pQZDcGqLwDTIJQ' // Kanika voice
): Promise<void> => {
  try {
    // Resume any suspended audio contexts before generating TTS
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('🔊 Resumed suspended AudioContext');
      }
    } catch (err) {
      console.warn('⚠️ Could not resume AudioContext:', err);
    }

    console.log('Generating TTS for donation:', { username, amount, message });

    const { data, error } = await supabase.functions.invoke('generate-donation-tts', {
      body: { 
        username, 
        amount, 
        message: message || '',
        voiceId 
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw error;
    }

    if (!data?.audioContent) {
      throw new Error('No audio content received');
    }

    // Convert base64 to blob
    const audioBlob = base64ToBlob(data.audioContent, 'audio/mpeg');
    const audioUrl = URL.createObjectURL(audioBlob);

    // Create and configure audio for OBS autoplay
    const audio = new Audio(audioUrl);
    audio.volume = 1.0;
    audio.autoplay = true;
    audio.muted = false;
    
    // Cleanup after playback
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      console.log('TTS playback completed');
    };

    audio.onerror = (err) => {
      console.error('Audio playback error:', err);
      URL.revokeObjectURL(audioUrl);
    };

    // Try to play with retry logic
    try {
      await audio.play();
      console.log('TTS playback started');
    } catch (playError) {
      console.warn('First play attempt failed, retrying...', playError);
      // Retry after brief delay
      setTimeout(async () => {
        try {
          await audio.play();
          console.log('TTS playback started (retry successful)');
        } catch (retryError) {
          console.error('Audio playback failed after retry:', retryError);
          URL.revokeObjectURL(audioUrl);
        }
      }, 100);
    }

  } catch (error) {
    console.error('TTS generation/playback failed:', error);
    // Don't throw - we want alerts to work even if TTS fails
  }
};
