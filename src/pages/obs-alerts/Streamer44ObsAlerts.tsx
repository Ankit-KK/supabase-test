import React from 'react';
import { AlertDisplay } from '@/components/AlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';

const Streamer44ObsAlerts = () => {
  const { config: pusherConfig, loading: configLoading } = usePusherConfig('streamer44');
  
  const { currentAlert, isVisible } = usePusherAlerts({
    channelName: 'streamer44-alerts',
    pusherKey: pusherConfig?.key || '',
    pusherCluster: pusherConfig?.cluster || '',
  });

  if (configLoading) {
    return <div className="fixed inset-0 bg-transparent flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="fixed inset-0 bg-transparent">
      <AlertDisplay
        donation={currentAlert}
        isVisible={isVisible}
        streamerBrandColor="#10b981"
        streamerName="Streamer 44"
      />
    </div>
  );
};

export default Streamer44ObsAlerts;
