import React from 'react';
import { AlertDisplay } from '@/components/AlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';

const Demo4ObsAlerts = () => {
  const { config: pusherConfig, loading: configLoading } = usePusherConfig();
  const { currentAlert, isVisible } = usePusherAlerts({
    channelName: 'demo4-alerts',
    pusherKey: pusherConfig?.key || '',
    pusherCluster: pusherConfig?.cluster || '',
  });

  if (configLoading) return <div className="fixed inset-0 bg-transparent flex items-center justify-center"><div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return <div className="fixed inset-0 bg-transparent"><AlertDisplay donation={currentAlert} isVisible={isVisible} streamerBrandColor="#f43f5e" streamerName="Demo Streamer 4" /></div>;
};

export default Demo4ObsAlerts;
