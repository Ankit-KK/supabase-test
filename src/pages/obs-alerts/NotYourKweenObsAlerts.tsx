import { useState, useEffect } from "react";
import { usePusherConfig } from "@/hooks/usePusherConfig";
import { usePusherAlerts } from "@/hooks/usePusherAlerts";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { UnifiedAlertDisplay } from "@/components/obs/UnifiedAlertDisplay";
import { ResizableWidget } from "@/components/obs/ResizableWidget";
import { LeaderboardWidget } from "@/components/obs/LeaderboardWidget";
import { supabase } from "@/integrations/supabase/client";
import Pusher from "pusher-js";
import { STREAMER_CONFIGS } from "@/config/streamers";

const config = STREAMER_CONFIGS.notyourkween;

const NotYourKweenObsAlerts = () => {
  const [alertBoxScale, setAlertBoxScale] = useState<number>(1.0);
  const [leaderboardEnabled, setLeaderboardEnabled] = useState<boolean>(true);
  const [brandColor, setBrandColor] = useState<string>(config.brandColor);
  const { config: pusherConfig, loading, error } = usePusherConfig("notyourkween");
  
  const { currentAlert, isVisible, connectionStatus, triggerTestAlert } = usePusherAlerts({
    pusherKey: pusherConfig?.key || "",
    pusherCluster: pusherConfig?.cluster || "",
    channelName: config.alertsChannel,
    delayByType: { hypersound: 15000, text: 60000, voice: 60000 },
    alertDuration: { text: 5000, hyperemote: 8000, voice: 15000 },
  });

  const { topDonator, latestDonations } = useLeaderboard({
    donationsTable: config.tableName,
    streamerSlug: config.slug,
    pusherKey: pusherConfig?.key || "",
    pusherCluster: pusherConfig?.cluster || "",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading configuration...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      {isVisible && currentAlert && (
        <UnifiedAlertDisplay
          donation={currentAlert}
          isVisible={isVisible}
          brandColor={brandColor}
          scale={alertBoxScale}
        />
      )}

      {leaderboardEnabled && (
        <ResizableWidget
          id="leaderboard"
          storagePrefix="notyourkween"
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
          <button onClick={triggerTestAlert} className="mt-2 px-2 py-1 bg-pink-600 rounded hover:bg-pink-700">
            Test Alert
          </button>
        </div>
      )}
    </div>
  );
};

export default NotYourKweenObsAlerts;
