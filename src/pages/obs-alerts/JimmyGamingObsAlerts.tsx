import React, { useState, useEffect } from 'react';
import { UnifiedAlertDisplay } from '@/components/obs/UnifiedAlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { ResizableWidget } from '@/components/obs/ResizableWidget';
import { LeaderboardWidget } from '@/components/obs/LeaderboardWidget';
import { supabase } from '@/integrations/supabase/client';
import Pusher from 'pusher-js';
import { STREAMER_CONFIGS } from '@/config/streamers';

const config = STREAMER_CONFIGS.jimmy_gaming;

const JimmyGamingObsAlerts = () => {
  const [alertBoxScale, setAlertBoxScale] = useState<number>(1.0);
  const [leaderboardEnabled, setLeaderboardEnabled] = useState<boolean>(true);
  const [brandColor, setBrandColor] = useState<string>(config.brandColor);

  const { config: pusherConfig, loading: configLoading } = usePusherConfig('jimmy_gaming');
  
  const {
    currentAlert,
    isVisible,
    connectionStatus,
    triggerTestAlert,
    queueSize
  } = usePusherAlerts({
    channelName: config.pusherAlertsChannel,
    pusherKey: pusherConfig?.key || '',
    pusherCluster: pusherConfig?.cluster || '',
    delayByType: {
      hypersound: 15000,
      text: 60000,
      voice: 60000,
    },
  });

  const { topDonator, latestDonations } = useLeaderboard({
    donationsTable: config.tableName,
    streamerSlug: config.slug,
    pusherKey: pusherConfig?.key || '',
    pusherCluster: pusherConfig?.cluster || '',
  });

  // Fetch initial settings
  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('streamers')
        .select('alert_box_scale, leaderboard_widget_enabled, brand_color')
        .eq('streamer_slug', config.slug)
        .single();
      
      if (!error && data) {
        if (data.alert_box_scale) setAlertBoxScale(Number(data.alert_box_scale));
        setLeaderboardEnabled(data.leaderboard_widget_enabled ?? true);
        if (data.brand_color) setBrandColor(data.brand_color);
      }
    };
    fetchSettings();
  }, []);

  // Subscribe to Pusher for real-time settings updates
  useEffect(() => {
    if (!pusherConfig?.key || !pusherConfig?.cluster) return;

    const pusher = new Pusher(pusherConfig.key, {
      cluster: pusherConfig.cluster,
    });

    const settingsChannel = pusher.subscribe(config.pusherSettingsChannel);

    settingsChannel.bind('settings-updated', (rawData: any) => {
      const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      
      if (data.leaderboard_widget_enabled !== undefined) {
        setLeaderboardEnabled(data.leaderboard_widget_enabled);
      }
      if (data.brand_color) {
        setBrandColor(data.brand_color);
      }
      if (data.alert_box_scale) {
        setAlertBoxScale(Number(data.alert_box_scale));
      }
    });

    return () => {
      settingsChannel.unbind_all();
      pusher.unsubscribe(config.pusherSettingsChannel);
      pusher.disconnect();
    };
  }, [pusherConfig]);

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
      <UnifiedAlertDisplay
        donation={currentAlert}
        isVisible={isVisible}
        brandColor={brandColor}
        scale={alertBoxScale}
      />

      {leaderboardEnabled && (
        <ResizableWidget
          id="leaderboard"
          storagePrefix="jimmy_gaming"
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
          <div>Channel: {config.pusherAlertsChannel}</div>
          <div>Queue: {queueSize} alert{queueSize !== 1 ? 's' : ''}</div>
          <div>Alert: {currentAlert ? `🔔 ${currentAlert.name}` : '⏸️ None'}</div>
          <div className="flex items-center gap-2">
            <span>Color:</span>
            <div style={{ width: 16, height: 16, backgroundColor: brandColor, border: '1px solid white', borderRadius: 4 }} />
            <span>{brandColor}</span>
          </div>
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
