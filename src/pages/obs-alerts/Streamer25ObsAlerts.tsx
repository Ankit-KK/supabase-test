import React from 'react';
import { AlertDisplay } from '@/components/AlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';

const Streamer25ObsAlerts = () => {
  const { config: pusherConfig, loading: configLoading } = usePusherConfig('streamer25');
  
  const { currentAlert, isVisible } = usePusherAlerts({
    channelName: 'streamer25-alerts',
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
        streamerBrandColor="#a855f7"
        streamerName="Streamer 25"
      />
    </div>
  );
};

export default Streamer25ObsAlerts;
