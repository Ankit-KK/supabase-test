import React, { useState, useEffect } from 'react';
import { ABdevilAlertDisplay } from '@/components/ABdevilAlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { ResizableWidget } from '@/components/obs/ResizableWidget';
import { LeaderboardWidget } from '@/components/obs/LeaderboardWidget';
import { supabase } from '@/integrations/supabase/client';

const ABdevilObsAlerts = () => {
  const [alertBoxScale, setAlertBoxScale] = useState<number>(1.0);
  const [leaderboardEnabled, setLeaderboardEnabled] = useState<boolean>(true);
  const [brandColor, setBrandColor] = useState<string>('#f97316');
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

  const { topDonator, latestDonations } = useLeaderboard({
    donationsTable: 'abdevil_donations',
    streamerSlug: 'abdevil',
    pusherKey: pusherConfig?.key || '',
    pusherCluster: pusherConfig?.cluster || '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('streamers')
        .select('alert_box_scale, leaderboard_widget_enabled, brand_color')
        .eq('streamer_slug', 'abdevil')
        .single();
      
      if (!error && data) {
        if (data.alert_box_scale) {
          setAlertBoxScale(Number(data.alert_box_scale));
        }
        setLeaderboardEnabled(data.leaderboard_widget_enabled ?? true);
        if (data.brand_color) {
          setBrandColor(data.brand_color);
        }
      }
    };
    fetchSettings();

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
        if (payload.new?.leaderboard_widget_enabled !== undefined) {
          setLeaderboardEnabled(payload.new.leaderboard_widget_enabled);
        }
        if (payload.new?.brand_color) {
          setBrandColor(payload.new.brand_color);
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

      {leaderboardEnabled && (
        <ResizableWidget
          id="leaderboard"
          storagePrefix="abdevil"
          defaultState={{ x: 50, y: 50, width: 400, height: 120 }}
        >
          <LeaderboardWidget
            topDonator={topDonator}
            latestDonations={latestDonations}
            brandColor={brandColor}
          />
        </ResizableWidget>
      )}
      
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
