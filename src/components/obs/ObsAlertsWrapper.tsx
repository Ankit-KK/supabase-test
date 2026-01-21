import React, { useState, useEffect } from 'react';
import { UnifiedAlertDisplay } from '@/components/obs/UnifiedAlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { supabase } from '@/integrations/supabase/client';
import { ResizableWidget } from '@/components/obs/ResizableWidget';
import { LeaderboardWidget } from '@/components/obs/LeaderboardWidget';
import Pusher from 'pusher-js';
import { STREAMER_CONFIGS, getStreamerConfig } from '@/config/streamers';

interface ObsAlertsWrapperProps {
  streamerSlug: string;
  storagePrefix?: string;
}

export const ObsAlertsWrapper: React.FC<ObsAlertsWrapperProps> = ({ 
  streamerSlug,
  storagePrefix 
}) => {
  const config = getStreamerConfig(streamerSlug);
  
  if (!config) {
    return (
      <div className="fixed inset-0 bg-transparent flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-red-500">Invalid streamer slug: {streamerSlug}</p>
        </div>
      </div>
    );
  }

  const [alertBoxScale, setAlertBoxScale] = useState<number>(1.0);
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(false);
  const [brandColor, setBrandColor] = useState(config.brandColor);
  const { config: pusherConfig, loading: configLoading } = usePusherConfig(streamerSlug);
  
  const {
    currentAlert,
    isVisible,
    connectionStatus,
    triggerTestAlert,
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
    streamerSlug: config.slug,
    donationsTable: config.tableName,
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
        if (data.leaderboard_widget_enabled !== null) setLeaderboardEnabled(data.leaderboard_widget_enabled);
        if (data.brand_color) setBrandColor(data.brand_color);
      }
    };
    fetchSettings();
  }, [config.slug]);

  // Pusher subscription for real-time settings updates
  useEffect(() => {
    if (!pusherConfig?.key) return;

    const pusher = new Pusher(pusherConfig.key, {
      cluster: pusherConfig.cluster,
    });

    const channel = pusher.subscribe(config.pusherSettingsChannel);
    channel.bind('settings-updated', (data: any) => {
      console.log('Settings updated via Pusher:', data);
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
      channel.unbind_all();
      pusher.unsubscribe(config.pusherSettingsChannel);
      pusher.disconnect();
    };
  }, [pusherConfig, config.pusherSettingsChannel]);

  if (configLoading) {
    return (
      <div className="fixed inset-0 bg-transparent flex items-center justify-center">
        <div className="text-white text-center">
          <div 
            className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: brandColor, borderTopColor: 'transparent' }}
          ></div>
          <p>Loading Pusher configuration...</p>
        </div>
      </div>
    );
  }

  const widgetStoragePrefix = storagePrefix || streamerSlug.replace('_', '-');

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
          storagePrefix={widgetStoragePrefix}
          defaultState={{ x: 20, y: 20, width: 400, height: 120 }}
        >
          <LeaderboardWidget
            topDonator={topDonator}
            latestDonations={latestDonations}
            brandColor={brandColor}
          />
        </ResizableWidget>
      )}
      
      {/* Debug info (only visible in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs space-y-1">
          <div>Status: {connectionStatus}</div>
          <div>Channel: {config.pusherAlertsChannel}</div>
          <div className="flex items-center gap-2">
            <span>Color:</span>
            <div style={{ width: 16, height: 16, backgroundColor: brandColor, border: '1px solid white', borderRadius: 4 }} />
            <span>{brandColor}</span>
          </div>
          <div>Alert: {currentAlert ? 'Active' : 'None'}</div>
          <button 
            onClick={triggerTestAlert}
            className="px-2 py-1 text-white rounded text-xs"
            style={{ backgroundColor: brandColor }}
          >
            Test Alert
          </button>
        </div>
      )}
    </div>
  );
};

export default ObsAlertsWrapper;
