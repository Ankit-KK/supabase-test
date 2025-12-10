import { useState, useEffect } from 'react';
import { usePusherConfig } from '@/hooks/usePusherConfig';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { SagarUjjwalGamingAlertDisplay } from '@/components/SagarUjjwalGamingAlertDisplay';
import { supabase } from '@/integrations/supabase/client';

const SagarUjjwalGamingObsAlerts = () => {
  const [alertBoxScale, setAlertBoxScale] = useState<number>(1.0);
  const { config: pusherConfig, loading: configLoading, error: configError } = usePusherConfig('sagarujjwalgaming');
  
  const { 
    currentAlert, 
    isVisible, 
    connectionStatus 
  } = usePusherAlerts({
    channelName: 'sagarujjwalgaming-alerts',
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
        .eq('streamer_slug', 'sagarujjwalgaming')
        .single();
      
      if (!error && data?.alert_box_scale) {
        setAlertBoxScale(Number(data.alert_box_scale));
      }
    };
    fetchScale();

    const channel = supabase
      .channel('sagarujjwalgaming-settings')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'streamers',
        filter: 'streamer_slug=eq.sagarujjwalgaming'
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
      <div className="flex items-center justify-center min-h-screen bg-transparent">
        <p className="text-white">Loading configuration...</p>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-transparent">
        <p className="text-red-500">Error: {configError}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent relative">
      <SagarUjjwalGamingAlertDisplay
        donation={currentAlert}
        isVisible={isVisible}
        streamerBrandColor="#ef4444"
        streamerName="SAGAR UJJWAL GAMING"
        scale={alertBoxScale}
      />
      
      {/* Debug panel (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs space-y-1">
          <div>Status: {connectionStatus}</div>
          <div>Channel: sagarujjwalgaming-alerts</div>
          <div>Group: {pusherConfig?.group || 1}</div>
        </div>
      )}
    </div>
  );
};

export default SagarUjjwalGamingObsAlerts;