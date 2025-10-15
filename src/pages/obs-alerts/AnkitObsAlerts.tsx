import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertDisplay } from '@/components/AlertDisplay';
import { useUnifiedAlerts } from '@/hooks/useUnifiedAlerts';

const AnkitObsAlerts = () => {
  const [searchParams] = useSearchParams();
  const obsToken = searchParams.get('token');

  const {
    currentAlert,
    isVisible,
    connectionStatus,
    tokenValid,
    triggerSync
  } = useUnifiedAlerts({
    streamerId: 'b111b82a-9fec-4e74-8a17-f81ee0e1c912',
    tableName: 'ankit_donations',
    enabled: !!obsToken,
    obsToken: obsToken || undefined
  });


  // Show loading state while validating token
  if (tokenValid === null) {
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
      <AlertDisplay
        donation={currentAlert}
        isVisible={isVisible}
        streamerBrandColor="#3b82f6"
        streamerName="Ankit"
      />
      
      {/* Debug info (only visible in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-3 rounded-lg text-xs space-y-2 max-w-xs">
          <div className="font-bold text-blue-400">🔧 Debug Panel</div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Status:</span>
            <span className={`px-2 py-0.5 rounded ${
              connectionStatus === 'connected' ? 'bg-green-600' :
              connectionStatus === 'polling' ? 'bg-yellow-600' :
              connectionStatus === 'connecting' ? 'bg-blue-600' :
              'bg-red-600'
            }`}>
              {connectionStatus.toUpperCase()}
            </span>
          </div>
          <div>Token: {obsToken?.substring(0, 8)}...</div>
          <div>Alert: {currentAlert ? `🔔 ${currentAlert.name}` : '⏸️ None'}</div>
          <button 
            onClick={triggerSync}
            className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
          >
            🔄 Force Sync
          </button>
        </div>
      )}
    </div>
  );
};

export default AnkitObsAlerts;