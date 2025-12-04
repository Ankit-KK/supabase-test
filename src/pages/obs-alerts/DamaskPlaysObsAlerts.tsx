import React, { useState, useEffect } from 'react';
import { DamaskPlaysAlertDisplay } from '@/components/DamaskPlaysAlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';
import { supabase } from '@/integrations/supabase/client';

const DamaskPlaysObsAlerts = () => {
  const [alertBoxScale, setAlertBoxScale] = useState<number>(1.0);
  const { config: pusherConfig, loading: configLoading } = usePusherConfig('damask_plays');
  
  const {
    currentAlert,
    isVisible,
    connectionStatus,
    triggerTestAlert,
  } = usePusherAlerts({
    channelName: 'damask_plays-alerts',
    pusherKey: pusherConfig?.key || '',
    pusherCluster: pusherConfig?.cluster || '',
    delayBeforeDisplay: 60000,
  });

  useEffect(() => {
    const fetchScale = async () => {
      const { data, error } = await supabase
        .from('streamers')
        .select('alert_box_scale')
        .eq('streamer_slug', 'damask_plays')
        .single();
      
      if (!error && data?.alert_box_scale) {
        setAlertBoxScale(Number(data.alert_box_scale));
      }
    };
    fetchScale();

    const channel = supabase
      .channel('damask_plays-settings')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'streamers',
        filter: 'streamer_slug=eq.damask_plays'
      }, (payload: any) => {
        if (payload.new?.alert_box_scale) {
          setAlertBoxScale(Number(payload.new.alert_box_scale));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (configLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-white text-xl">Loading alerts system...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden">
      <DamaskPlaysAlertDisplay
        donation={currentAlert}
        isVisible={isVisible}
        streamerName="Damask plays"
        streamerBrandColor="#10b981"
        scale={alertBoxScale}
      />
      
      {/* Debug panel for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs space-y-1">
          <div>Status: {connectionStatus}</div>
          <div>Channel: damask_plays-alerts</div>
          <div>Group: {pusherConfig?.group || 1}</div>
          <button 
            onClick={triggerTestAlert}
            className="mt-2 px-2 py-1 bg-emerald-600 rounded hover:bg-emerald-700"
          >
            Test Alert
          </button>
        </div>
      )}
    </div>
  );
};

export default DamaskPlaysObsAlerts;
