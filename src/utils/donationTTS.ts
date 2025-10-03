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
    console.log('🎤 Generating TTS for donation:', { username, amount, message });

    // Ensure AudioContext is resumed before generating TTS
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('✅ AudioContext resumed before TTS');
      }
    } catch (ctxError) {
      console.warn('AudioContext check failed:', ctxError);
    }

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
    audio.muted = false;  // Explicitly unmuted
    audio.volume = 1.0;
    audio.autoplay = true;
    
    // Cleanup after playback
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      console.log('✅ TTS playback completed');
    };

    audio.onerror = (err) => {
      console.error('❌ Audio playback error:', err);
      URL.revokeObjectURL(audioUrl);
    };

    // Enhanced retry logic with progressive delays
    const playWithRetry = async (attempts = 3) => {
      for (let i = 0; i < attempts; i++) {
        try {
          await audio.play();
          console.log(`✅ TTS playing (attempt ${i + 1})`);
          return;
        } catch (err) {
          console.warn(`Play attempt ${i + 1} failed:`, err);
          if (i === attempts - 1) {
            throw err;
          }
          // Progressive delay: 100ms, 200ms, 300ms
          await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
        }
      }
    };

    await playWithRetry();

  } catch (error) {
    console.error('❌ TTS generation/playback failed:', error);
    
    // Fallback to Web Speech API (bypasses autoplay restrictions)
    try {
      const fallbackText = message 
        ? `${username} donated ${amount} rupees. ${message}`
        : `${username} donated ${amount} rupees. Thank you!`;
      
      console.log('🔄 Trying Web Speech API fallback');
      const utterance = new SpeechSynthesisUtterance(fallbackText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
      console.log('✅ Web Speech API fallback succeeded');
    } catch (fallbackError) {
      console.error('❌ Web Speech API fallback also failed:', fallbackError);
    }
  }
};
