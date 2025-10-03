import React, { useEffect } from 'react';
import { initializeAudioForOBS } from '@/utils/audioInitializer';

/**
 * AudioEnabler component
 * Automatically enables audio playback in OBS without user interaction
 * Uses silent audio preload technique to unlock browser audio permissions
 */
export const AudioEnabler: React.FC = () => {
  useEffect(() => {
    const enableAudioAutomatically = async () => {
      try {
        // Attempt automatic initialization
        const success = await initializeAudioForOBS();
        
        if (!success) {
          // Retry after 500ms if failed
          console.log('Retrying audio initialization...');
          setTimeout(async () => {
            await initializeAudioForOBS();
          }, 500);
        }
      } catch (error) {
        console.error('Audio auto-enable error:', error);
      }
    };

    // Run on component mount
    enableAudioAutomatically();

    // Also run on window load as fallback
    window.addEventListener('load', enableAudioAutomatically);
    
    return () => {
      window.removeEventListener('load', enableAudioAutomatically);
    };
  }, []);

  // No UI - fully automatic
  return null;
};
