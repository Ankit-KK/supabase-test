import React from 'react';
import { AlertDisplay } from '@/components/AlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';

const Streamer38ObsAlerts = () => {
  const { config: pusherConfig, loading: configLoading } = usePusherConfig('streamer38');
  
  const { currentAlert, isVisible } = usePusherAlerts({
    channelName: 'streamer38-alerts',
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
        streamerName="Streamer 38"
      />
    </div>
  );
};

export default Streamer38ObsAlerts;
