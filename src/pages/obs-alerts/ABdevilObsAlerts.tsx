import React, { useState, useEffect } from 'react';
import { ABdevilAlertDisplay } from '@/components/ABdevilAlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';
import { supabase } from '@/integrations/supabase/client';

const ABdevilObsAlerts = () => {
  const [alertBoxScale, setAlertBoxScale] = useState<number>(1.0);
  const { config: pusherConfig, loading: configLoading } = usePusherConfig('abdevil');
  
  const {
    currentAlert,
    isVisible,
    connectionStatus,
    triggerTestAlert,
  } = usePusherAlerts({
    channelName: 'abdevil-alerts',
    pusherKey: pusherConfig?.key || '',
    pusherCluster: pusherConfig?.cluster || '',
    delayBeforeDisplay: 60000,
  });

  useEffect(() => {
    const fetchScale = async () => {
      const { data, error } = await supabase
        .from('streamers')
        .select('alert_box_scale')
        .eq('streamer_slug', 'abdevil')
        .single();
      
      if (!error && data?.alert_box_scale) {
        setAlertBoxScale(Number(data.alert_box_scale));
      }
    };
    fetchScale();

    const channel = supabase
      .channel('abdevil-settings')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'streamers',
        filter: 'streamer_slug=eq.abdevil'
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
      <ABdevilAlertDisplay
        donation={currentAlert}
        isVisible={isVisible}
        scale={alertBoxScale}
      />
      
      {/* Debug panel (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs space-y-1">
          <div>Status: {connectionStatus}</div>
          <div>Channel: abdevil-alerts</div>
          <div>Group: {pusherConfig?.group || 1}</div>
          <button 
            onClick={triggerTestAlert}
            className="mt-2 px-2 py-1 bg-orange-600 rounded hover:bg-orange-700"
          >
            Test Alert
          </button>
        </div>
      )}
    </div>
  );
};

export default ABdevilObsAlerts;