import React from 'react';
import { AlertDisplay } from '@/components/AlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';

const Streamer39ObsAlerts = () => {
  const { config: pusherConfig, loading: configLoading } = usePusherConfig('streamer39');
  
  const { currentAlert, isVisible } = usePusherAlerts({
    channelName: 'streamer39-alerts',
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
        streamerName="Streamer 39"
      />
    </div>
  );
};

export default Streamer39ObsAlerts;
