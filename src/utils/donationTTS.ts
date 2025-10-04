import { supabase } from "@/integrations/supabase/client";

// TTS Queue to prevent overlapping audio
let ttsQueue: Array<() => Promise<void>> = [];
let isPlaying = false;
let currentAudio: HTMLAudioElement | null = null;

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
 * Process TTS queue
 */
const processTTSQueue = async () => {
  if (isPlaying || ttsQueue.length === 0) return;
  
  isPlaying = true;
  const nextTTS = ttsQueue.shift();
  
  if (nextTTS) {
    try {
      await nextTTS();
    } catch (error) {
      console.error('❌ TTS queue processing error:', error);
    }
  }
  
  isPlaying = false;
  
  // Process next in queue
  if (ttsQueue.length > 0) {
    setTimeout(() => processTTSQueue(), 100);
  }
};

/**
 * Stop current TTS playback
 */
export const stopCurrentTTS = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  ttsQueue = [];
  isPlaying = false;
};

/**
 * Generate and play TTS for donation announcement with queue management
 * @param username - Name of the donor
 * @param amount - Donation amount
 * @param message - Optional donation message
 * @param voiceId - ElevenLabs voice ID (defaults to Kanika voice)
 * @param priority - If true, clears queue and plays immediately
 */
export const generateAndPlayTTS = async (
  username: string,
  amount: number,
  message?: string,
  voiceId: string = 'H6QPv2pQZDcGqLwDTIJQ', // Kanika voice
  priority: boolean = false
): Promise<void> => {
  const donationText = message 
    ? `${username} donated ${amount} rupees. ${message}`
    : `${username} donated ${amount} rupees. Thank you!`;

  console.log('🎤 Queueing ElevenLabs TTS:', { username, amount, priority, queueLength: ttsQueue.length });

  // Priority TTS clears the queue
  if (priority) {
    stopCurrentTTS();
  }

  // Add to queue
  ttsQueue.push(async () => {
    await playTTSWithRetry(donationText, voiceId, username, amount, message);
  });

  // Start processing queue
  processTTSQueue();
};

/**
 * Internal function to play TTS with retry logic
 */
const playTTSWithRetry = async (
  donationText: string,
  voiceId: string,
  username: string,
  amount: number,
  message?: string,
  retries: number = 2
): Promise<void> => {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      console.log(`🎤 TTS attempt ${attempt}/${retries + 1} for: ${username}`);

      // Ensure AudioContext is ready
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
          console.log('✅ AudioContext resumed');
        }
      } catch (ctxError) {
        console.warn('⚠️ AudioContext check failed:', ctxError);
      }

      // Call edge function (ElevenLabs has built-in timeout)
      const { data, error } = await supabase.functions.invoke('generate-donation-tts', {
        body: { 
          username, 
          amount, 
          message: message || '',
          voiceId 
        }
      });

      if (error) {
        throw new Error(`Edge function error: ${error.message || JSON.stringify(error)}`);
      }

      if (!data?.audioContent) {
        throw new Error('No audio content received from TTS service');
      }

      // Convert base64 to blob
      const audioBlob = base64ToBlob(data.audioContent, 'audio/mpeg');
      const audioUrl = URL.createObjectURL(audioBlob);

      // Play audio
      await playAudioWithFallback(audioUrl, donationText);

      console.log(`✅ TTS completed successfully for: ${username}`);
      return; // Success - exit retry loop

    } catch (error) {
      console.error(`❌ TTS attempt ${attempt} failed:`, error);
      
      if (attempt <= retries) {
        console.log(`🔄 Retrying in ${attempt}s...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      } else {
        console.error('❌ All TTS attempts failed for:', username);
        // Fallback to Web Speech API as last resort
        try {
          await fallbackToWebSpeech(donationText);
        } catch (fallbackError) {
          console.error('❌ Fallback TTS also failed:', fallbackError);
        }
      }
    }
  }
};

/**
 * Play audio with multiple fallback methods
 */
const playAudioWithFallback = async (audioUrl: string, text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio(audioUrl);
    currentAudio = audio;
    
    audio.volume = 1.0;
    audio.preload = 'auto';

    let resolved = false;

    audio.onended = () => {
      if (!resolved) {
        resolved = true;
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        console.log('✅ Audio playback completed');
        resolve();
      }
    };

    audio.onerror = (err) => {
      if (!resolved) {
        resolved = true;
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        console.error('❌ Audio playback error:', err);
        reject(new Error('Audio playback failed'));
      }
    };

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        audio.pause();
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        reject(new Error('Audio playback timeout'));
      }
    }, 30000);

    // Try to play
    audio.play().catch((playError) => {
      console.error('❌ Audio.play() failed:', playError);
      if (!resolved) {
        resolved = true;
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        reject(playError);
      }
    });
  });
};

/**
 * Fallback to Web Speech API if ElevenLabs fails
 */
const fallbackToWebSpeech = async (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log('🗣️ Falling back to Web Speech API');
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onend = () => {
      console.log('✅ Web Speech API completed');
      resolve();
    };

    utterance.onerror = (event) => {
      console.error('❌ Web Speech API error:', event);
      reject(new Error(`Speech synthesis error: ${event.error}`));
    };

    window.speechSynthesis.speak(utterance);
  });
};
