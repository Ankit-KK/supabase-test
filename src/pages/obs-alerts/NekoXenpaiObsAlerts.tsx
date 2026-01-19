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

const config = STREAMER_CONFIGS.neko_xenpai;

const NekoXenpaiObsAlerts = () => {
  const [alertBoxScale, setAlertBoxScale] = useState<number>(1.0);
  const [leaderboardEnabled, setLeaderboardEnabled] = useState<boolean>(true);
  const [brandColor, setBrandColor] = useState<string>(config.brandColor);
  const { config: pusherConfig, loading: configLoading } = usePusherConfig('neko_xenpai');
  
  const {
    currentAlert,
    isVisible,
    connectionStatus,
  } = usePusherAlerts({
    channelName: config.alertsChannel,
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

    const settingsChannel = pusher.subscribe(config.settingsChannel);

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
      pusher.unsubscribe(config.settingsChannel);
      pusher.disconnect();
    };
  }, [pusherConfig]);

  if (configLoading) {
    return (
      <div className="fixed inset-0 bg-transparent flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
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
          storagePrefix="neko_xenpai"
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
          <div>Channel: {config.alertsChannel}</div>
          <div className="flex items-center gap-2">
            <span>Color:</span>
            <div style={{ width: 16, height: 16, backgroundColor: brandColor, border: '1px solid white', borderRadius: 4 }} />
            <span>{brandColor}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NekoXenpaiObsAlerts;
