import React, { useState, useEffect, useRef } from 'react';
import GoalOverlay from '@/components/GoalOverlay';
import { supabase } from '@/integrations/supabase/client';
import Pusher from 'pusher-js';
import { convertToINR } from '@/constants/currencies';

const CLUMSYGOD_STREAMER_ID = '320d8369-f75f-419a-98a9-16d5f5ceaf16';

interface GoalData {
  goalName: string;
  targetAmount: number;
  activatedAt: string | null;
  isActive: boolean;
}

const ClumsyGodGoalOverlay = () => {
  const [goalData, setGoalData] = useState<GoalData | null>(null);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [brandColor, setBrandColor] = useState<string>('#ef4444');
  const [pusherConfig, setPusherConfig] = useState<{ key: string; cluster: string } | null>(null);
  const pusherRef = useRef<Pusher | null>(null);

  useEffect(() => {
    const fetchPusherConfig = async () => {
      const { data, error } = await supabase.functions.invoke('get-pusher-config', {
        body: { streamer_slug: 'clumsygod' }
      });
      if (!error && data) {
        setPusherConfig({ key: data.key, cluster: data.cluster });
      }
    };
    fetchPusherConfig();
  }, []);

  useEffect(() => {
    const fetchGoalData = async () => {
      const { data: streamerData } = await supabase
        .from('streamers')
        .select('goal_name, goal_target_amount, goal_activated_at, goal_is_active, brand_color')
        .eq('id', CLUMSYGOD_STREAMER_ID)
        .single();

      if (streamerData) {
        if (streamerData.brand_color) {
          setBrandColor(streamerData.brand_color);
        }
        setGoalData({
          goalName: streamerData.goal_name || '',
          targetAmount: streamerData.goal_target_amount || 0,
          activatedAt: streamerData.goal_activated_at,
          isActive: streamerData.goal_is_active || false,
        });

        if (streamerData.goal_is_active && streamerData.goal_activated_at) {
          const { data: donations } = await supabase
            .from('clumsygod_donations')
            .select('amount, currency')
            .gte('created_at', streamerData.goal_activated_at)
            .eq('payment_status', 'success');

          const total = donations?.reduce((sum, d) => sum + convertToINR(Number(d.amount), d.currency || 'INR'), 0) || 0;
          setCurrentAmount(total);
        }
      }
    };

    fetchGoalData(); // Initial fetch only - real-time updates come via Pusher (no polling to reduce egress)
  }, []);

  useEffect(() => {
    if (!pusherConfig?.key || pusherRef.current) return;

    const pusher = new Pusher(pusherConfig.key, {
      cluster: pusherConfig.cluster,
    });
    pusherRef.current = pusher;

    const goalChannel = pusher.subscribe('clumsygod-goal');
    goalChannel.bind('goal-progress', (data: { currentAmount: number; targetAmount: number }) => {
      setCurrentAmount(data.currentAmount);
    });

    const settingsChannel = pusher.subscribe('clumsygod-settings');
    settingsChannel.bind('settings-updated', (rawData: any) => {
      const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      if (data.brand_color) {
        setBrandColor(data.brand_color);
      }
    });

    return () => {
      if (pusherRef.current) {
        try {
          goalChannel.unbind_all();
          settingsChannel.unbind_all();
          pusher.unsubscribe('clumsygod-goal');
          pusher.unsubscribe('clumsygod-settings');
          pusherRef.current.disconnect();
        } catch (e) {
          console.log('Pusher cleanup:', e);
        }
        pusherRef.current = null;
      }
    };
  }, [pusherConfig]);

  if (!goalData?.isActive) {
    return null;
  }

  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden flex items-center justify-center">
      <GoalOverlay
        goalName={goalData.goalName}
        currentAmount={currentAmount}
        targetAmount={goalData.targetAmount}
        brandColor={brandColor}
      />
    </div>
  );
};

export default ClumsyGodGoalOverlay;
