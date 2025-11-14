import React from 'react';
import { AlertDisplay } from '@/components/AlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';

const DamaskPlaysObsAlerts = () => {
  const { config: pusherConfig, loading: configLoading } = usePusherConfig('damask_plays');
  
  const {
    currentAlert,
    isVisible,
    connectionStatus,
    triggerTestAlert,
  } = usePusherAlerts({
    channelName: 'damask_plays-alerts',
    pusherKey: pusherConfig?.key || '',
    pusherCluster: pusherConfig?.cluster || '',
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
      <AlertDisplay
        donation={currentAlert}
        isVisible={isVisible}
        streamerName="Damask plays"
        streamerBrandColor="#10b981"
      />
      
      {/* Debug panel for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs space-y-1">
          <div>Status: {connectionStatus}</div>
          <div>Channel: damask_plays-alerts</div>
          <div>Group: {pusherConfig?.group || 1}</div>
          <button 
            onClick={triggerTestAlert}
            className="mt-2 px-2 py-1 bg-emerald-600 rounded hover:bg-emerald-700"
          >
            Test Alert
          </button>
        </div>
      )}
    </div>
  );
};

export default DamaskPlaysObsAlerts;
