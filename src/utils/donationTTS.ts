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
  const donationText = message 
    ? `${username} donated ${amount} rupees. ${message}`
    : `${username} donated ${amount} rupees. Thank you!`;

  console.log('🎤 Generating TTS for donation:', { username, amount, message });

  // PRIMARY METHOD: Web Speech API (works without OBS audio control)
  try {
    console.log('🗣️ Attempting Web Speech API (primary method)');
    console.log('Browser:', navigator.userAgent.includes('OBS') ? 'OBS CEF' : 'Regular');
    
    // Wait for voices to be loaded
    let voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      console.log('⏳ Waiting for voices to load...');
      await new Promise<void>((resolve) => {
        window.speechSynthesis.onvoiceschanged = () => resolve();
        setTimeout(() => resolve(), 1000); // Timeout after 1s
      });
      voices = window.speechSynthesis.getVoices();
    }
    
    console.log('Available voices:', voices.length);
    
    if (voices.length === 0) {
      throw new Error('No voices available in Web Speech API');
    }
    
    const utterance = new SpeechSynthesisUtterance(donationText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Wrap in Promise to detect actual success/failure
    await new Promise<void>((resolve, reject) => {
      utterance.onend = () => {
        console.log('✅ Web Speech API completed successfully');
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('❌ Web Speech API error:', event);
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };
      
      // Timeout if nothing happens in 2 seconds
      const timeout = setTimeout(() => {
        reject(new Error('Web Speech API timeout - no response after 2s'));
      }, 2000);
      
      utterance.onend = () => {
        clearTimeout(timeout);
        console.log('✅ Web Speech API completed successfully');
        resolve();
      };
      
      window.speechSynthesis.speak(utterance);
      console.log('🎤 Web Speech API utterance queued');
    });
    
    // If we reach here, Web Speech API worked - exit early
    return;
  } catch (webSpeechError) {
    console.warn('⚠️ Web Speech API failed, falling back to ElevenLabs:', webSpeechError);
  }

  // FALLBACK METHOD: ElevenLabs TTS (requires "Control Audio via OBS" setting)
  try {
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
    audio.muted = false;
    audio.volume = 1.0;
    audio.autoplay = true;
    
    // Cleanup after playback
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      console.log('✅ ElevenLabs TTS playback completed');
    };

    audio.onerror = (err) => {
      console.error('❌ Audio playback error:', err);
      URL.revokeObjectURL(audioUrl);
    };

    await audio.play();
    console.log('✅ ElevenLabs TTS playing');

  } catch (error) {
    console.error('❌ All TTS methods failed:', error);
  }
};
