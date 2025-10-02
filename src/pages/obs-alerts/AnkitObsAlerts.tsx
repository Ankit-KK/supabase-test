import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertDisplay } from '@/components/AlertDisplay';
import { useDirectAlerts } from '@/hooks/useDirectAlerts';
import { generateAndPlayTTS } from '@/utils/donationTTS';

const AnkitObsAlerts = () => {
  const [searchParams] = useSearchParams();
  const obsToken = searchParams.get('token');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const {
    currentAlert,
    isVisible,
    connectionStatus,
    triggerTestAlert,
    triggerTestVoiceAlert,
    tokenValid: directTokenValid
  } = useDirectAlerts({
    streamerId: 'b111b82a-9fec-4e74-8a17-f81ee0e1c912', // Ankit's streamer ID
    tableName: 'ankit_donations',
    enabled: !!obsToken,
    obsToken: obsToken || undefined
  });

  // Handle audio unlock via user gesture
  const handleUnlockAudio = async () => {
    try {
      // Create and resume audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      await audioContext.resume();
      
      // Play silent audio to unlock
      const audio = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABMYXZjNTguMTM0AAAAAAAAAAAAAAAAJAAAAAAAAAAAA4QAAAAAAAAAAAAAAAAAAA==');
      await audio.play();
      
      setAudioUnlocked(true);
      console.log('✅ Audio unlocked via user gesture');
    } catch (error) {
      console.error('❌ Audio unlock failed:', error);
    }
  };

  // Update local token validation state based on direct alerts
  useEffect(() => {
    if (directTokenValid !== null) {
      setTokenValid(directTokenValid);
    }
  }, [directTokenValid]);

  // Trigger TTS when a new alert appears
  useEffect(() => {
    if (isVisible && currentAlert) {
      generateAndPlayTTS(
        currentAlert.name,
        currentAlert.amount,
        currentAlert.message || ''
      ).catch(err => console.error('TTS playback failed:', err));
    }
  }, [isVisible, currentAlert]);

  // Show loading state while validating token
  if (tokenValid === null || directTokenValid === null) {
    return (
      <div className="fixed inset-0 bg-transparent flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Validating token...</p>
        </div>
      </div>
    );
  }

  // Show error if no token or invalid token
  if (!obsToken || tokenValid === false) {
    return (
      <div className="fixed inset-0 bg-transparent flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold mb-2">Invalid OBS Token</p>
          <p>Please check your Browser Source URL and token.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-transparent">
      {/* Audio unlock overlay */}
      {!audioUnlocked && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <button
            onClick={handleUnlockAudio}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            🔊 Enable Alerts Audio
          </button>
        </div>
      )}
      
      <AlertDisplay
        donation={currentAlert}
        isVisible={isVisible}
        streamerBrandColor="#3b82f6"
        streamerName="Ankit"
      />
      
      {/* Debug info (only visible in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs space-y-1">
          <div>Status: {connectionStatus}</div>
          <div>Token: {obsToken?.substring(0, 8)}...</div>
          <div>Alert: {currentAlert ? 'Active' : 'None'}</div>
          <button 
            onClick={triggerTestAlert}
            className="px-2 py-1 bg-blue-600 text-white rounded text-xs mr-1"
          >
            Test Alert
          </button>
          <button 
            onClick={triggerTestVoiceAlert}
            className="px-2 py-1 bg-purple-600 text-white rounded text-xs"
          >
            Test Voice
          </button>
        </div>
      )}
    </div>
  );
};

export default AnkitObsAlerts;