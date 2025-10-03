/**
 * Global Audio Initializer for OBS Browser Sources
 * Automatically enables audio playback without user interaction
 */

let audioInitialized = false;

export const initializeAudioForOBS = async (): Promise<boolean> => {
  if (audioInitialized) {
    console.log('🔊 Audio already initialized');
    return true;
  }
  
  try {
    // Create AudioContext
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Resume AudioContext if suspended (unlocks audio)
    if (ctx.state === 'suspended') {
      await ctx.resume();
      console.log('✅ AudioContext resumed from suspended state');
    }
    
    // Play a silent 1ms oscillator tone to warm up the audio system
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    gainNode.gain.value = 0.001; // Nearly silent
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.001); // Stop after 1ms
    
    console.log('✅ Silent oscillator warm-up completed');
    
    audioInitialized = true;
    localStorage.setItem('audio_initialized', Date.now().toString());
    
    console.log('🔊 Audio system initialized for OBS');
    return true;
  } catch (error) {
    console.error('❌ Audio initialization failed:', error);
    return false;
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
