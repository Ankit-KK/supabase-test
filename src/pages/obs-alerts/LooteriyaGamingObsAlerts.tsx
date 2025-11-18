import React from 'react';
import { LooteriyaGamingAlertDisplay } from '@/components/LooteriyaGamingAlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';

const LooteriyaGamingObsAlerts = () => {
  const { config: pusherConfig, loading: configLoading } = usePusherConfig('looteriya_gaming');
  
  const {
    currentAlert,
    isVisible,
    connectionStatus,
    triggerTestAlert,
  } = usePusherAlerts({
    channelName: 'looteriya_gaming-alerts',
    pusherKey: pusherConfig?.key || '',
    pusherCluster: pusherConfig?.cluster || '',
  });

  if (configLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading Pusher configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden">
      <LooteriyaGamingAlertDisplay
        donation={currentAlert}
        isVisible={isVisible}
        streamerName="Looteriya Gaming"
        streamerBrandColor="#f59e0b"
      />
      
      {/* Debug info (only visible in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs space-y-1">
          <div>Status: {connectionStatus}</div>
          <div>Channel: looteriya_gaming-alerts</div>
          <div>Alert: {currentAlert ? 'Active' : 'None'}</div>
          <button 
            onClick={triggerTestAlert}
            className="px-2 py-1 bg-amber-600 text-white rounded text-xs"
          >
            Test Alert
          </button>
        </div>
      )}
    </div>
  );
};

export default LooteriyaGamingObsAlerts;
