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
 * Silently fails during initial page load (within 5 seconds)
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
    // Silently suppress errors during initial page load grace period
    const pageLoadTime = Date.now() - (window.performance?.timing?.navigationStart || Date.now());
    if (pageLoadTime > 5000) {
      console.warn('⚠️ AudioContext resume failed (enable "Control Audio via OBS")');
    }
    return false;
  }
};

export const initializeAudioForOBS = async (): Promise<AudioStatus> => {
  if (audioInitialized) {
    return 'ready';
  }
  
  try {
    // Get or create AudioContext (lazy initialization)
    const ctx = getAudioContext();
    
    // Check if audio is blocked by autoplay policy
    if (ctx.state === 'suspended') {
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
    
    console.log('✅ Audio system initialized');
    
    audioInitialized = true;
    localStorage.setItem('audio_initialized', Date.now().toString());
    
    return 'ready';
  } catch (error) {
    // Silently fail during grace period
    return 'blocked';
  }
};

// Don't auto-initialize - let it happen lazily when first alert arrives

export const isAudioInitialized = (): boolean => {
  return audioInitialized || !!localStorage.getItem('audio_initialized');
};
