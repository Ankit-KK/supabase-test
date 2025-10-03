/**
 * Global Audio Initializer for OBS Browser Sources
 * Automatically enables audio playback without user interaction
 */

let audioInitialized = false;

// Base64 encoded silent MP3 (1 second)
const SILENT_AUDIO_BASE64 = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7v///////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAA4T/';

export const initializeAudioForOBS = async (): Promise<boolean> => {
  if (audioInitialized) {
    console.log('🔊 Audio already initialized');
    return true;
  }
  
  try {
    // Play silent audio to unlock browser audio permissions
    const silent = new Audio(SILENT_AUDIO_BASE64);
    silent.volume = 0.01;
    await silent.play();
    
    // Resume AudioContext if suspended
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') {
      await ctx.resume();
      console.log('✅ AudioContext resumed');
    }
    
    audioInitialized = true;
    localStorage.setItem('audio_initialized', Date.now().toString());
    
    console.log('🔊 Audio system initialized for OBS');
    return true;
  } catch (error) {
    console.error('❌ Audio initialization failed:', error);
    return false;
  }
};

export const isAudioInitialized = (): boolean => {
  return audioInitialized || !!localStorage.getItem('audio_initialized');
};
