import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import GoalOverlay from '@/components/GoalOverlay';
import { STREAMER_CONFIGS, getStreamerConfig } from '@/config/streamers';
import Pusher from 'pusher-js';

interface GoalData {
  name: string;
  target: number;
  activatedAt: string;
  isActive: boolean;
}

interface GoalOverlayWrapperProps {
  streamerSlug: string;
}

export const GoalOverlayWrapper: React.FC<GoalOverlayWrapperProps> = ({ streamerSlug }) => {
  const config = getStreamerConfig(streamerSlug);
  
  const [goalData, setGoalData] = useState<GoalData | null>(null);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [brandColor, setBrandColor] = useState(config?.brandColor || '#ec4899');
  const [pusherConfig, setPusherConfig] = useState<{ key: string; cluster: string } | null>(null);
  const [streamerId, setStreamerId] = useState<string | null>(null);

  if (!config) {
    return null;
  }

  // Fetch Pusher configuration
  useEffect(() => {
    const fetchPusherConfig = async () => {
      const { data, error } = await supabase.functions.invoke('get-pusher-config', {
        body: { streamer_slug: streamerSlug }
      });
      if (!error && data) {
        setPusherConfig(data);
      }
    };
    fetchPusherConfig();
  }, [streamerSlug]);

  // Fetch goal data and calculate current amount
  const fetchGoalData = useCallback(async () => {
    // First get the streamer ID and goal data
    const { data: streamerData, error: streamerError } = await supabase
      .from('streamers')
      .select('id, goal_name, goal_target_amount, goal_activated_at, goal_is_active, brand_color')
      .eq('streamer_slug', streamerSlug)
      .single();

    if (streamerError || !streamerData) {
      console.error('Error fetching streamer data:', streamerError);
      return;
    }

    setStreamerId(streamerData.id);
    
    if (streamerData.brand_color) {
      setBrandColor(streamerData.brand_color);
    }

    if (!streamerData.goal_is_active || !streamerData.goal_name || !streamerData.goal_target_amount) {
      setGoalData(null);
      return;
    }

    setGoalData({
      name: streamerData.goal_name,
      target: streamerData.goal_target_amount,
      activatedAt: streamerData.goal_activated_at || new Date().toISOString(),
      isActive: streamerData.goal_is_active,
    });

    // Fetch goal progress via edge function (donation tables are locked down)
    const { data: progressData, error: progressError } = await supabase.functions.invoke('get-goal-progress', {
      body: { streamerSlug },
    });

    if (progressError) {
      console.error('Error fetching goal progress:', progressError);
      return;
    }

    if (progressData?.currentProgress !== undefined) {
      setCurrentAmount(progressData.currentProgress);
    }
  }, [streamerSlug, config.tableName]);

  // Initial fetch only - real-time updates come via Pusher (no polling to reduce egress)
  useEffect(() => {
    fetchGoalData();
  }, [fetchGoalData]);

  // Pusher subscription for real-time updates
  useEffect(() => {
    if (!pusherConfig?.key) return;

    const pusher = new Pusher(pusherConfig.key, {
      cluster: pusherConfig.cluster,
    });

    // Subscribe to goal channel
    const goalChannel = pusher.subscribe(config.pusherGoalChannel);
    goalChannel.bind('goal-progress', (data: any) => {
      console.log('Goal progress update:', data);
      if (data.currentAmount !== undefined) {
        setCurrentAmount(data.currentAmount);
      }
      if (data.goalData) {
        setGoalData(data.goalData);
      }
    });

    // Subscribe to settings channel for brand color updates
    const settingsChannel = pusher.subscribe(config.pusherSettingsChannel);
    settingsChannel.bind('settings-updated', (data: any) => {
      console.log('Settings updated:', data);
      if (data.brand_color) {
        setBrandColor(data.brand_color);
      }
      // Refetch goal data if goal settings changed
      if (data.goal_name !== undefined || data.goal_target !== undefined || data.goal_is_active !== undefined) {
        fetchGoalData();
      }
    });

    return () => {
      goalChannel.unbind_all();
      settingsChannel.unbind_all();
      pusher.unsubscribe(config.pusherGoalChannel);
      pusher.unsubscribe(config.pusherSettingsChannel);
      pusher.disconnect();
    };
  }, [pusherConfig, config.pusherGoalChannel, config.pusherSettingsChannel, fetchGoalData]);

  if (!goalData || !goalData.isActive) {
    return null;
  }

  return (
    <GoalOverlay
      goalName={goalData.name}
      currentAmount={currentAmount}
      targetAmount={goalData.target}
      brandColor={brandColor}
    />
  );
};

export default GoalOverlayWrapper;
