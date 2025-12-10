import React, { useState, useEffect } from 'react';
import { AlertDisplay } from '@/components/AlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';
import { supabase } from '@/integrations/supabase/client';

const SizzorsObsAlerts = () => {
  const [alertBoxScale, setAlertBoxScale] = useState<number>(1.0);
  const { config: pusherConfig, loading: configLoading } = usePusherConfig('sizzors');
  
  const {
    currentAlert,
    isVisible,
    connectionStatus,
    triggerTestAlert,
  } = usePusherAlerts({
    channelName: 'sizzors-alerts',
    pusherKey: pusherConfig?.key || '',
    pusherCluster: pusherConfig?.cluster || '',
    delayByType: {
      hypersound: 15000,
      text: 60000,
      voice: 60000,
    },
  });

  useEffect(() => {
    const fetchScale = async () => {
      const { data, error } = await supabase
        .from('streamers')
        .select('alert_box_scale')
        .eq('streamer_slug', 'sizzors')
        .single();
      
      if (!error && data?.alert_box_scale) {
        setAlertBoxScale(Number(data.alert_box_scale));
      }
    };
    fetchScale();

    const channel = supabase
      .channel('sizzors-settings')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'streamers',
        filter: 'streamer_slug=eq.sizzors'
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
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading Pusher configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden">
      <AlertDisplay
        donation={currentAlert}
        isVisible={isVisible}
        streamerName="Sizzors"
        streamerBrandColor="#8b5cf6"
        scale={alertBoxScale}
      />
      
      {/* Debug info (only visible in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs space-y-1">
          <div>Status: {connectionStatus}</div>
          <div>Channel: sizzors-alerts</div>
          <div>Alert: {currentAlert ? 'Active' : 'None'}</div>
          <button 
            onClick={triggerTestAlert}
            className="px-2 py-1 bg-purple-600 text-white rounded text-xs"
          >
            Test Alert
          </button>
        </div>
      )}
    </div>
  );
};

export default SizzorsObsAlerts;
