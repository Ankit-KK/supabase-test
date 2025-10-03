/**
 * Global Audio Initializer for OBS Browser Sources
 * Detects if audio can play automatically (requires OBS "Control Audio via OBS")
 */

let audioInitialized = false;

export type AudioStatus = 'ready' | 'suspended' | 'blocked';

export const initializeAudioForOBS = async (): Promise<AudioStatus> => {
  if (audioInitialized) {
    console.log('🔊 Audio already initialized');
    return 'ready';
  }
  
  try {
    // Create AudioContext
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Check if audio is blocked by autoplay policy
    if (ctx.state === 'suspended') {
      console.warn('⚠️ AudioContext suspended - Enable "Control Audio via OBS" in Browser Source settings');
      return 'suspended';
    }
    
    // Play a silent 1ms oscillator tone to warm up the audio system
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    gainNode.gain.value = 0.001; // Nearly silent
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.001); // Stop after 1ms
    
    console.log('✅ Audio system ready for OBS');
    
    audioInitialized = true;
    localStorage.setItem('audio_initialized', Date.now().toString());
    
    return 'ready';
  } catch (error) {
    console.error('❌ Audio initialization failed:', error);
    return 'blocked';
  }
};

// Auto-initialize on window load (as recommended by Chrome docs)
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    initializeAudioForOBS();
  });
}

export const isAudioInitialized = (): boolean => {
  return audioInitialized || !!localStorage.getItem('audio_initialized');
};
