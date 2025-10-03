import React, { useEffect } from 'react';
import { initializeAudioForOBS, AudioStatus } from '@/utils/audioInitializer';

/**
 * AudioEnabler component
 * Detects OBS audio status and logs appropriate messages
 * Web Speech API works regardless of OBS audio control setting
 */
export const AudioEnabler: React.FC = () => {
  useEffect(() => {
    const checkAudioStatus = async () => {
      const status: AudioStatus = await initializeAudioForOBS();
      
      if (status === 'suspended') {
        console.warn('⚠️ OBS SETUP REQUIRED: Enable "Control Audio via OBS" in Browser Source properties');
        console.warn('📝 Right-click Browser Source → Properties → Check "Control Audio via OBS"');
        console.log('ℹ️ Web Speech API will still work for TTS announcements');
      } else if (status === 'ready') {
        console.log('✅ Audio system ready - All TTS methods available');
      }
    };

    checkAudioStatus();
    window.addEventListener('load', checkAudioStatus);
    
    return () => {
      window.removeEventListener('load', checkAudioStatus);
    };
  }, []);

  // No UI - fully automatic
  return null;
};
