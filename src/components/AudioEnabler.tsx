import React, { useState, useEffect } from 'react';
import { Volume2 } from 'lucide-react';

/**
 * AudioEnabler component
 * Displays a one-time overlay to enable audio playback in OBS
 * Required due to browser autoplay policies
 */
export const AudioEnabler: React.FC = () => {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    // Check if audio has already been enabled in this session
    const audioEnabled = sessionStorage.getItem('audio_enabled');
    if (!audioEnabled) {
      setShowOverlay(true);
    }
  }, []);

  const enableAudio = async () => {
    try {
      // Resume any suspended audio contexts
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('✅ Audio enabled - AudioContext resumed');
      }
      
      // Mark audio as enabled for this session
      sessionStorage.setItem('audio_enabled', 'true');
      
      // Hide the overlay
      setShowOverlay(false);
      
      console.log('✅ Audio enabled for OBS alerts');
    } catch (error) {
      console.error('❌ Failed to enable audio:', error);
      // Still hide the overlay even if there's an error
      sessionStorage.setItem('audio_enabled', 'true');
      setShowOverlay(false);
    }
  };

  if (!showOverlay) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="text-center space-y-6 p-8 rounded-lg bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-purple-500/30 max-w-md mx-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
            <Volume2 className="w-10 h-10 text-white" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Enable Audio</h2>
          <p className="text-gray-300 text-sm">
            Click the button below to enable text-to-speech for donation alerts
          </p>
        </div>

        <button
          onClick={enableAudio}
          className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
        >
          Enable Audio
        </button>

        <p className="text-xs text-gray-400">
          You only need to do this once per session
        </p>
      </div>
    </div>
  );
};
