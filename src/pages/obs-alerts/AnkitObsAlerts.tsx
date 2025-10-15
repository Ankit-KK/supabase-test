import React from 'react';
import { AlertDisplay } from '@/components/AlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';

const AnkitObsAlerts = () => {
  // Real-time alerts via Pusher
  const {
    currentAlert,
    isVisible,
    connectionStatus,
    triggerTestAlert,
    queueSize
  } = usePusherAlerts({
    channelName: 'ankit-alerts',
    pusherKey: '5adfbac388b9dfa055c0',
    pusherCluster: 'ap2',
  });

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
          <div className="font-bold text-blue-400">🔧 Pusher Debug Panel</div>
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
          <div>Channel: ankit-alerts</div>
          <div>Queue: {queueSize} alert{queueSize !== 1 ? 's' : ''}</div>
          <div>Alert: {currentAlert ? `🔔 ${currentAlert.name}` : '⏸️ None'}</div>
          <button 
            onClick={triggerTestAlert}
            className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
          >
            🧪 Test Alert
          </button>
        </div>
      )}
    </div>
  );
};

export default AnkitObsAlerts;