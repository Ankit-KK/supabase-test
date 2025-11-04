import React from 'react';
import { AlertDisplay } from '@/components/AlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';

const Streamer29ObsAlerts = () => {
  const { config: pusherConfig, loading: configLoading } = usePusherConfig('streamer29');
  
  const { currentAlert, isVisible } = usePusherAlerts({
    channelName: 'streamer29-alerts',
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
        streamerName="Streamer 29"
      />
    </div>
  );
};

export default Streamer29ObsAlerts;
