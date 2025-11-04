import React from 'react';
import { AlertDisplay } from '@/components/AlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';

const Streamer40ObsAlerts = () => {
  const { config: pusherConfig, loading: configLoading } = usePusherConfig('streamer40');
  
  const { currentAlert, isVisible } = usePusherAlerts({
    channelName: 'streamer40-alerts',
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
        streamerBrandColor="#8b5cf6"
        streamerName="Streamer 40"
      />
    </div>
  );
};

export default Streamer40ObsAlerts;
