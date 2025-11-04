import React from 'react';
import { AlertDisplay } from '@/components/AlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';

const Streamer43ObsAlerts = () => {
  const { config: pusherConfig, loading: configLoading } = usePusherConfig('streamer43');
  
  const { currentAlert, isVisible } = usePusherAlerts({
    channelName: 'streamer43-alerts',
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
        streamerBrandColor="#f59e0b"
        streamerName="Streamer 43"
      />
    </div>
  );
};

export default Streamer43ObsAlerts;
