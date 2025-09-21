import React, { useState, useEffect } from 'react';
import { AlertDisplay } from '@/components/AlertDisplay';
import { useDirectAlerts } from '@/hooks/useDirectAlerts';

const ArtCreateObsAlerts = () => {
  const [obsToken, setObsToken] = useState<string | null>(null);

  const {
    currentAlert,
    isVisible,
    connectionStatus,
    triggerTestAlert,
    triggerTestVoiceAlert,
    tokenValid: directTokenValid
  } = useDirectAlerts({
    streamerId: 'artcreate',
    tableName: 'chia_gaming_donations',
    obsToken: obsToken || undefined
  });

  useEffect(() => {
    // Get OBS token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setObsToken(token);
    }
  }, []);

  if (!obsToken) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">ArtCreate Alerts</h2>
          <p className="text-gray-400">
            Please provide a valid OBS token in the URL parameters.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Format: ?token=your_obs_token
          </p>
        </div>
      </div>
    );
  }

  if (!directTokenValid) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">ArtCreate Alerts</h2>
          <p className="text-red-400">
            Invalid or expired OBS token. Please check your token and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden">
      <AlertDisplay
        donation={currentAlert}
        isVisible={isVisible}
        streamerName="ArtCreate"
        streamerBrandColor="#ec4899"
      />
      
      {/* Debug info (only visible in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs space-y-1">
          <div>Status: {connectionStatus}</div>
          <div>Token: {obsToken?.substring(0, 8)}...</div>
          <div>Alert: {currentAlert ? 'Active' : 'None'}</div>
          <button 
            onClick={triggerTestAlert}
            className="px-2 py-1 bg-pink-600 text-white rounded text-xs mr-1"
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

export default ArtCreateObsAlerts;