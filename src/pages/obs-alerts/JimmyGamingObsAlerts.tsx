import React, { useState, useEffect } from 'react';
import { JimmyGamingAlertDisplay } from '@/components/JimmyGamingAlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';
import { supabase } from '@/integrations/supabase/client';

const JimmyGamingObsAlerts = () => {
  const [alertBoxScale, setAlertBoxScale] = useState<number>(1.0);

  const { config: pusherConfig, loading: configLoading } = usePusherConfig('jimmy_gaming');
  
  const {
    currentAlert,
    isVisible,
    connectionStatus,
    triggerTestAlert,
    queueSize
  } = usePusherAlerts({
    channelName: 'jimmy_gaming-alerts',
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
        .eq('streamer_slug', 'jimmy_gaming')
        .single();
      
      if (!error && data?.alert_box_scale) {
        setAlertBoxScale(Number(data.alert_box_scale));
      }
    };
    fetchScale();

    const channel = supabase
      .channel('jimmy_gaming-settings')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'streamers',
        filter: 'streamer_slug=eq.jimmy_gaming'
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

  if (configLoading || !pusherConfig) {
    return (
      <div className="fixed inset-0 bg-transparent flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p>Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-transparent">
      <JimmyGamingAlertDisplay
        donation={currentAlert}
        isVisible={isVisible}
        scale={alertBoxScale}
      />
      
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-3 rounded-lg text-xs space-y-2 max-w-xs">
          <div className="font-bold text-green-400">🔧 Pusher Debug Panel</div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Status:</span>
            <span className={`px-2 py-0.5 rounded ${
              connectionStatus === 'connected' ? 'bg-green-600' :
              connectionStatus === 'connecting' ? 'bg-yellow-600' :
              'bg-red-600'
            }`}>
              {connectionStatus.toUpperCase()}
            </span>
          </div>
          <div>Channel: jimmy_gaming-alerts</div>
          <div>Queue: {queueSize} alert{queueSize !== 1 ? 's' : ''}</div>
          <div>Alert: {currentAlert ? `🔔 ${currentAlert.name}` : '⏸️ None'}</div>
          <button 
            onClick={triggerTestAlert}
            className="w-full px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
          >
            🧪 Test Alert
          </button>
        </div>
      )}
    </div>
  );
};

export default JimmyGamingObsAlerts;
