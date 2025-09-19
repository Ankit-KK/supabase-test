import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertDisplay } from '@/components/AlertDisplay';
import { useDirectAlerts } from '@/hooks/useDirectAlerts';

const ChiaGamingObsAlerts = () => {
  const [searchParams] = useSearchParams();
  const obsToken = searchParams.get('token');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const {
    currentAlert,
    isVisible,
    connectionStatus,
    tokenValid: directTokenValid
  } = useDirectAlerts({
    streamerId: 'chia-gaming-id', // This will need to be updated with actual streamer ID
    tableName: 'chia_gaming_donations',
    enabled: !!obsToken,
    obsToken: obsToken || undefined
  });

  // Update local token validation state based on direct alerts
  useEffect(() => {
    if (directTokenValid !== null) {
      setTokenValid(directTokenValid);
    }
  }, [directTokenValid]);

  // Show loading state while validating token
  if (tokenValid === null || directTokenValid === null) {
    return (
      <div className="fixed inset-0 bg-transparent flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
      <AlertDisplay
        donation={currentAlert}
        isVisible={isVisible}
        streamerBrandColor="#ec4899"
        streamerName="Chia Gaming"
      />
      
      {/* Debug info (only visible in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs">
          <div>Status: {connectionStatus}</div>
          <div>Token: {obsToken?.substring(0, 8)}...</div>
          <div>Alert: {currentAlert ? 'Active' : 'None'}</div>
        </div>
      )}
    </div>
  );
};

export default ChiaGamingObsAlerts;