import React, { useState, useEffect, useRef } from 'react';
import GoalOverlay from '@/components/GoalOverlay';
import { supabase } from '@/integrations/supabase/client';
import Pusher from 'pusher-js';
import { convertToINR } from '@/constants/currencies';

const BONGFLICK_STREAMER_ID = 'd2213d8d-fbff-4e32-b8cf-3cbcf5308249';

interface GoalData {
  goalName: string;
  targetAmount: number;
  activatedAt: string | null;
  isActive: boolean;
}

const BongFlickGoalOverlay = () => {
  const [goalData, setGoalData] = useState<GoalData | null>(null);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [brandColor, setBrandColor] = useState<string>('#8b5cf6');
  const [pusherConfig, setPusherConfig] = useState<{ key: string; cluster: string } | null>(null);
  const pusherRef = useRef<Pusher | null>(null);

  useEffect(() => {
    const fetchPusherConfig = async () => {
      const { data, error } = await supabase.functions.invoke('get-pusher-config', {
        body: { streamer_slug: 'bongflick' }
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
        .eq('id', BONGFLICK_STREAMER_ID)
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
            .from('bongflick_donations')
            .select('amount, currency')
            .gte('created_at', streamerData.goal_activated_at)
            .eq('payment_status', 'success');

          const total = donations?.reduce((sum, d) => sum + convertToINR(Number(d.amount), d.currency || 'INR'), 0) || 0;
          setCurrentAmount(total);
        }
      }
    };

    fetchGoalData();
    const interval = setInterval(fetchGoalData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!pusherConfig?.key || pusherRef.current) return;

    const pusher = new Pusher(pusherConfig.key, {
      cluster: pusherConfig.cluster,
    });
    pusherRef.current = pusher;

    const goalChannel = pusher.subscribe('bongflick-goal');
    goalChannel.bind('goal-progress', (data: { currentAmount: number }) => {
      setCurrentAmount(data.currentAmount);
    });

    const settingsChannel = pusher.subscribe('bongflick-settings');
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
          pusher.unsubscribe('bongflick-goal');
          pusher.unsubscribe('bongflick-settings');
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

export default BongFlickGoalOverlay;
