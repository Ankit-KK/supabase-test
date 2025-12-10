import React from 'react';
import NekoXenpaiAlertDisplay from '@/components/NekoXenpaiAlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';

const NekoXenpaiObsAlerts = () => {
  const { config: pusherConfig, loading: configLoading } = usePusherConfig('neko_xenpai');
  
  const {
    currentAlert,
    isVisible,
    connectionStatus,
  } = usePusherAlerts({
    channelName: 'neko_xenpai-alerts',
    pusherKey: pusherConfig?.key || '',
    pusherCluster: pusherConfig?.cluster || '',
    delayByType: {
      hypersound: 15000,
      text: 60000,
      voice: 60000,
    },
    alertDuration: {
      text: 15000,
      voice: 60000,
      hyperemote: 15000,
    },
  });

  if (configLoading) {
    return (
      <div className="fixed inset-0 bg-transparent flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-transparent">
      <NekoXenpaiAlertDisplay
        donation={currentAlert}
        isVisible={isVisible}
      />
    </div>
  );
};

export default NekoXenpaiObsAlerts;
