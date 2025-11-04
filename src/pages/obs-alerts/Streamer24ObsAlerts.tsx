import React from 'react';
import { AlertDisplay } from '@/components/AlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';

const Streamer24ObsAlerts = () => {
  const { config: pusherConfig, loading: configLoading } = usePusherConfig('streamer24');
  
  const { currentAlert, isVisible } = usePusherAlerts({
    channelName: 'streamer24-alerts',
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
        streamerBrandColor="#6366f1"
        streamerName="Streamer 24"
      />
    </div>
  );
};

export default Streamer24ObsAlerts;
