import React, { useEffect } from 'react';
import { initializeAudioForOBS, AudioStatus, resumeAudioContext } from '@/utils/audioInitializer';

/**
 * AudioEnabler component
 * Detects OBS audio status and logs appropriate messages
 * Automatically attempts to resume AudioContext when alerts arrive
 */
export const AudioEnabler: React.FC = () => {
  useEffect(() => {
    const checkAudioStatus = async () => {
      const status: AudioStatus = await initializeAudioForOBS();
      
      if (status === 'suspended') {
        console.warn('⚠️ OBS SETUP RECOMMENDED: Enable "Control Audio via OBS" in Browser Source properties');
        console.warn('📝 Right-click Browser Source → Properties → Check "Control Audio via OBS"');
        console.log('ℹ️ Audio will auto-resume when alerts arrive, or use Web Speech API as fallback');
      } else if (status === 'ready') {
        console.log('✅ Audio system ready - ElevenLabs TTS available');
      }
    };

    checkAudioStatus();
    
    // Attempt to resume AudioContext periodically (helps with OBS)
    const resumeInterval = setInterval(async () => {
      await resumeAudioContext();
    }, 5000);
    
    return () => {
      clearInterval(resumeInterval);
    };
  }, []);

  // No UI - fully automatic
  return null;
};
