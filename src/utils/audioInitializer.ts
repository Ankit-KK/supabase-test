/**
 * Global Audio Initializer for OBS Browser Sources
 * Detects if audio can play automatically (requires OBS "Control Audio via OBS")
 */

let audioInitialized = false;
let globalAudioContext: AudioContext | null = null;

export type AudioStatus = 'ready' | 'suspended' | 'blocked';

/**
 * Get or create the global AudioContext instance
 */
export const getAudioContext = (): AudioContext => {
  if (!globalAudioContext) {
    globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return globalAudioContext;
};

/**
 * Resume the AudioContext if it's suspended
 */
export const resumeAudioContext = async (): Promise<boolean> => {
  try {
    const ctx = getAudioContext();
    
    if (ctx.state === 'suspended') {
      await ctx.resume();
      console.log('✅ AudioContext resumed successfully');
      return true;
    }
    
    return ctx.state === 'running';
  } catch (error) {
    console.error('❌ Failed to resume AudioContext:', error);
    return false;
  }
};

export const initializeAudioForOBS = async (): Promise<AudioStatus> => {
  if (audioInitialized) {
    console.log('🔊 Audio already initialized');
    return 'ready';
  }
  
  try {
    // Get or create AudioContext
    const ctx = getAudioContext();
    
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
