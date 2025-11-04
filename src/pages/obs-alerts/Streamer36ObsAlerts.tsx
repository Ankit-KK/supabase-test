import React from 'react';
import { AlertDisplay } from '@/components/AlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';

const Streamer36ObsAlerts = () => {
  const { config: pusherConfig, loading: configLoading } = usePusherConfig('streamer36');
  
  const { currentAlert, isVisible } = usePusherAlerts({
    channelName: 'streamer36-alerts',
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
        streamerBrandColor="#ef4444"
        streamerName="Streamer 36"
      />
    </div>
  );
};

export default Streamer36ObsAlerts;
