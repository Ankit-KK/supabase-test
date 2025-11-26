import React from 'react';
import { VIPBhaiAlertDisplay } from '@/components/VIPBhaiAlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';

const VIPBhaiObsAlerts = () => {
  const { config: pusherConfig, loading: configLoading } = usePusherConfig('vipbhai');
  
  const {
    currentAlert,
    isVisible,
    connectionStatus,
    triggerTestAlert,
  } = usePusherAlerts({
    channelName: 'vipbhai-alerts',
    pusherKey: pusherConfig?.key || '',
    pusherCluster: pusherConfig?.cluster || '',
    delayBeforeDisplay: 60000, // 1 minute delay
  });

  if (configLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-white text-xl">Loading alerts system...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden">
      <VIPBhaiAlertDisplay
        donation={currentAlert}
        isVisible={isVisible}
        streamerName="VIP BHAI"
        streamerBrandColor="#f59e0b"
      />
      
      {/* Debug panel (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs space-y-1">
          <div>Status: {connectionStatus}</div>
          <div>Channel: vipbhai-alerts</div>
          <div>Group: {pusherConfig?.group || 1}</div>
          <button 
            onClick={triggerTestAlert}
            className="mt-2 px-2 py-1 bg-amber-600 rounded hover:bg-amber-700"
          >
            Test Alert
          </button>
        </div>
      )}
    </div>
  );
};

export default VIPBhaiObsAlerts;
