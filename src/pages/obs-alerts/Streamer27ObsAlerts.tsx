import React from 'react';
import { AlertDisplay } from '@/components/AlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';

const Streamer27ObsAlerts = () => {
  const { config: pusherConfig, loading: configLoading } = usePusherConfig('streamer27');
  
  const { currentAlert, isVisible } = usePusherAlerts({
    channelName: 'streamer27-alerts',
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
        streamerName="Streamer 27"
      />
    </div>
  );
};

export default Streamer27ObsAlerts;
