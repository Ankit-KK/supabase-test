import React from 'react';
import { AlertDisplay } from '@/components/AlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';

const Streamer26ObsAlerts = () => {
  const { config: pusherConfig, loading: configLoading } = usePusherConfig('streamer26');
  
  const { currentAlert, isVisible } = usePusherAlerts({
    channelName: 'streamer26-alerts',
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
        streamerBrandColor="#e11d48"
        streamerName="Streamer 26"
      />
    </div>
  );
};

export default Streamer26ObsAlerts;
