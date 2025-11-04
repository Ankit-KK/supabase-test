import React from 'react';
import { AlertDisplay } from '@/components/AlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';

const Demo2ObsAlerts = () => {
  const { config: pusherConfig, loading: configLoading } = usePusherConfig('demo2');
  const { currentAlert, isVisible, connectionStatus, triggerTestAlert } = usePusherAlerts({
    channelName: 'demo2-alerts',
    pusherKey: pusherConfig?.key || '',
    pusherCluster: pusherConfig?.cluster || '',
  });

  if (configLoading) {
    return <div className="fixed inset-0 bg-transparent flex items-center justify-center"><div className="text-white text-center"><div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p>Loading...</p></div></div>;
  }

  return (
    <div className="fixed inset-0 bg-transparent">
      <AlertDisplay donation={currentAlert} isVisible={isVisible} streamerBrandColor="#06b6d4" streamerName="Demo Streamer 2" />
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs space-y-1">
          <div>Status: {connectionStatus}</div>
          <div>Channel: demo2-alerts</div>
          <button onClick={triggerTestAlert} className="px-2 py-1 bg-cyan-600 text-white rounded text-xs">Test Alert</button>
        </div>
      )}
    </div>
  );
};

export default Demo2ObsAlerts;
