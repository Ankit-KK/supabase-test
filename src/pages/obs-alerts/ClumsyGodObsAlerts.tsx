import React, { useState, useEffect } from 'react';
import { ClumsyGodAlertDisplay } from '@/components/ClumsyGodAlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { ResizableWidget } from '@/components/obs/ResizableWidget';
import { LeaderboardWidget } from '@/components/obs/LeaderboardWidget';
import { supabase } from '@/integrations/supabase/client';

const ClumsyGodObsAlerts = () => {
  const [alertBoxScale, setAlertBoxScale] = useState<number>(1.0);
  const [leaderboardEnabled, setLeaderboardEnabled] = useState<boolean>(true);
  const [brandColor, setBrandColor] = useState<string>('#ef4444');

  const { config: pusherConfig, loading: configLoading } = usePusherConfig('clumsygod');
  
  const {
    currentAlert,
    isVisible,
    connectionStatus,
    triggerTestAlert,
    queueSize
  } = usePusherAlerts({
    channelName: 'clumsygod-alerts',
    pusherKey: pusherConfig?.key || '',
    pusherCluster: pusherConfig?.cluster || '',
    delayByType: {
      hypersound: 15000,
      text: 60000,
      voice: 60000,
    },
  });

  const { topDonator, latestDonations } = useLeaderboard({
    donationsTable: 'clumsygod_donations',
    streamerSlug: 'clumsygod',
    pusherKey: pusherConfig?.key || '',
    pusherCluster: pusherConfig?.cluster || '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('streamers')
        .select('alert_box_scale, leaderboard_widget_enabled, brand_color')
        .eq('streamer_slug', 'clumsygod')
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
      .channel('clumsygod-settings')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'streamers',
        filter: 'streamer_slug=eq.clumsygod'
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
      <ClumsyGodAlertDisplay
        donation={currentAlert}
        isVisible={isVisible}
        scale={alertBoxScale}
      />

      {leaderboardEnabled && (
        <ResizableWidget
          id="leaderboard"
          storagePrefix="clumsygod"
          defaultState={{ x: 50, y: 50, width: 400, height: 120 }}
        >
          <LeaderboardWidget
            topDonator={topDonator}
            latestDonations={latestDonations}
            brandColor={brandColor}
          />
        </ResizableWidget>
      )}
      
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-3 rounded-lg text-xs space-y-2 max-w-xs">
          <div className="font-bold text-violet-400">🔧 Pusher Debug Panel</div>
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
          <div>Channel: clumsygod-alerts</div>
          <div>Queue: {queueSize} alert{queueSize !== 1 ? 's' : ''}</div>
          <div>Alert: {currentAlert ? `🔔 ${currentAlert.name}` : '⏸️ None'}</div>
          <button 
            onClick={triggerTestAlert}
            className="w-full px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded text-xs font-medium transition-colors"
          >
            🧪 Test Alert
          </button>
        </div>
      )}
    </div>
  );
};

export default ClumsyGodObsAlerts;
