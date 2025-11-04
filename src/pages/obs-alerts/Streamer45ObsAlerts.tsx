import React from 'react';
import { AlertDisplay } from '@/components/AlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';

const Streamer45ObsAlerts = () => {
  const { config: pusherConfig, loading: configLoading } = usePusherConfig('streamer45');
  
  const { currentAlert, isVisible } = usePusherAlerts({
    channelName: 'streamer45-alerts',
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
        streamerBrandColor="#06b6d4"
        streamerName="Streamer 45"
      />
    </div>
  );
};

export default Streamer45ObsAlerts;
