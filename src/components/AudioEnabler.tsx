import React, { useEffect } from 'react';
import { initializeAudioForOBS, AudioStatus } from '@/utils/audioInitializer';

/**
 * AudioEnabler component
 * Passively checks OBS audio status after a grace period
 * Audio initialization happens lazily when first alert arrives
 */
export const AudioEnabler: React.FC = () => {
  useEffect(() => {
    // Wait 2 seconds for OBS Browser Source to fully initialize
    const timer = setTimeout(async () => {
      const status: AudioStatus = await initializeAudioForOBS();
      
      if (status === 'suspended') {
        console.warn('⚠️ OBS SETUP RECOMMENDED: Enable "Control Audio via OBS" in Browser Source properties');
        console.warn('📝 Right-click Browser Source → Properties → Check "Control Audio via OBS"');
        console.log('ℹ️ Audio will initialize automatically when first alert arrives');
      } else if (status === 'ready') {
        console.log('✅ Audio system ready - ElevenLabs TTS available');
      }
    }, 2000); // 2-second grace period
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  // No UI - fully automatic
  return null;
};
