import React from 'react';
import { AlertDisplay } from '@/components/AlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';

const LofiBeatsObsAlerts = () => {
  const { config: pusherConfig, loading: configLoading } = usePusherConfig('lofibeats');
  
  const {
    currentAlert,
    isVisible,
    connectionStatus,
    triggerTestAlert,
    queueSize
  } = usePusherAlerts({
    channelName: 'lofibeats-alerts',
    pusherKey: pusherConfig?.key || '',
    pusherCluster: pusherConfig?.cluster || '',
  });

  if (configLoading || !pusherConfig) {
    return (
      <div className="fixed inset-0 bg-transparent flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p>Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-transparent">
      <AlertDisplay
        donation={currentAlert}
        isVisible={isVisible}
        streamerBrandColor="#9b59b6"
        streamerName="LofiBeats"
      />
      
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-3 rounded-lg text-xs space-y-2 max-w-xs">
          <div className="font-bold text-red-400">🔧 Pusher Debug Panel</div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Status:</span>
            <span className={`px-2 py-0.5 rounded ${
              connectionStatus === 'connected' ? 'bg-green-600' :
              connectionStatus === 'connecting' ? 'bg-yellow-600' :
              'bg-red-600'
            }`}>
              {connectionStatus.toUpperCase()}
            </span>
          </div>
          <div>Channel: lofibeats-alerts</div>
          <div>Queue: {queueSize} alert{queueSize !== 1 ? 's' : ''}</div>
          <div>Alert: {currentAlert ? `🔔 ${currentAlert.name}` : '⏸️ None'}</div>
          <button 
            onClick={triggerTestAlert}
            className="w-full px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
          >
            🧪 Test Alert
          </button>
        </div>
      )}
    </div>
  );
};

export default LofiBeatsObsAlerts;
