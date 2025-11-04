import React from 'react';
import { AlertDisplay } from '@/components/AlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';

const Streamer30ObsAlerts = () => {
  const { config: pusherConfig, loading: configLoading } = usePusherConfig('streamer30');
  
  const { currentAlert, isVisible } = usePusherAlerts({
    channelName: 'streamer30-alerts',
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
        streamerBrandColor="#ec4899"
        streamerName="Streamer 30"
      />
    </div>
  );
};

export default Streamer30ObsAlerts;
