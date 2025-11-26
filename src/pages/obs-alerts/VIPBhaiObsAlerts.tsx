import React from 'react';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import VIPBhaiAlertDisplay from '@/components/VIPBhaiAlertDisplay';
import { ConnectionStatus } from '@/components/ConnectionStatus';

const VIPBhaiObsAlerts = () => {
  const { currentAlert } = usePusherAlerts({
    channelName: 'vipbhai-alerts',
    pusherKey: import.meta.env.VITE_PUSHER_KEY || '',
    pusherCluster: import.meta.env.VITE_PUSHER_CLUSTER || 'ap2',
    delayBeforeDisplay: 60000,
  });

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-transparent">
      <ConnectionStatus />
      {currentAlert && <VIPBhaiAlertDisplay donation={currentAlert} />}
    </div>
  );
};

export default VIPBhaiObsAlerts;
