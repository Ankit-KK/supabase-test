import React from 'react';
import { AlertDisplay } from '@/components/AlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';

const Demo3ObsAlerts = () => {
  const { config: pusherConfig, loading: configLoading } = usePusherConfig('demo3');
  const { currentAlert, isVisible } = usePusherAlerts({
    channelName: 'demo3-alerts',
    pusherKey: pusherConfig?.key || '',
    pusherCluster: pusherConfig?.cluster || '',
  });

  if (configLoading) return <div className="fixed inset-0 bg-transparent flex items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return <div className="fixed inset-0 bg-transparent"><AlertDisplay donation={currentAlert} isVisible={isVisible} streamerBrandColor="#10b981" streamerName="Demo Streamer 3" /></div>;
};

export default Demo3ObsAlerts;
