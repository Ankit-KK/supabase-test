import React, { useState, useEffect } from 'react';
import { ChiaaGamingAlertDisplay } from '@/components/ChiaaGamingAlertDisplay';
import { usePusherAlerts } from '@/hooks/usePusherAlerts';
import { usePusherConfig } from '@/hooks/usePusherConfig';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { supabase } from '@/integrations/supabase/client';
import { ResizableWidget } from '@/components/obs/ResizableWidget';
import { LeaderboardWidget } from '@/components/obs/LeaderboardWidget';
import Pusher from 'pusher-js';

const ChiaGamingObsAlerts = () => {
  const [alertBoxScale, setAlertBoxScale] = useState<number>(1.0);
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(false);
  const [brandColor, setBrandColor] = useState('#ec4899');
  const { config: pusherConfig, loading: configLoading } = usePusherConfig('chiaa_gaming');
  
  const {
    currentAlert,
    isVisible,
    connectionStatus,
    triggerTestAlert,
  } = usePusherAlerts({
    channelName: 'chiaa_gaming-alerts',
    pusherKey: pusherConfig?.key || '',
    pusherCluster: pusherConfig?.cluster || '',
    delayByType: {
      hypersound: 15000,
      text: 60000,
      voice: 60000,
    },
  });

  const { topDonator, latestDonations } = useLeaderboard({
    streamerSlug: 'chiaa_gaming',
    donationsTable: 'chiaa_gaming_donations',
    pusherKey: pusherConfig?.key || '',
    pusherCluster: pusherConfig?.cluster || '',
  });

  // Fetch initial settings
  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('streamers')
        .select('alert_box_scale, leaderboard_widget_enabled, brand_color')
        .eq('streamer_slug', 'chiaa_gaming')
        .single();
      
      if (!error && data) {
        if (data.alert_box_scale) setAlertBoxScale(Number(data.alert_box_scale));
        if (data.leaderboard_widget_enabled !== null) setLeaderboardEnabled(data.leaderboard_widget_enabled);
        if (data.brand_color) setBrandColor(data.brand_color);
      }
    };
    fetchSettings();
  }, []);

  // Pusher subscription for real-time settings updates
  useEffect(() => {
    if (!pusherConfig?.key) return;

    const pusher = new Pusher(pusherConfig.key, {
      cluster: pusherConfig.cluster,
    });

    const channel = pusher.subscribe('chiaa_gaming-settings');
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
      pusher.unsubscribe('chiaa_gaming-settings');
      pusher.disconnect();
    };
  }, [pusherConfig]);

  if (configLoading) {
    return (
      <div className="fixed inset-0 bg-transparent flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading Pusher configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-transparent">
      <ChiaaGamingAlertDisplay
        donation={currentAlert}
        isVisible={isVisible}
        scale={alertBoxScale}
      />

      {leaderboardEnabled && (
        <ResizableWidget
          id="leaderboard"
          storagePrefix="chiaa-gaming"
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
          <div>Channel: chiaa_gaming-alerts</div>
          <div>Brand Color: {brandColor}</div>
          <div>Alert: {currentAlert ? 'Active' : 'None'}</div>
          <button 
            onClick={triggerTestAlert}
            className="px-2 py-1 bg-pink-600 text-white rounded text-xs"
          >
            Test Alert
          </button>
        </div>
      )}
    </div>
  );
};

export default ChiaGamingObsAlerts;
