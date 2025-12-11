import React, { useState, useEffect } from 'react';
import GoalOverlay from '@/components/GoalOverlay';
import { supabase } from '@/integrations/supabase/client';
import Pusher from 'pusher-js';
import { convertToINR } from '@/constants/currencies';

interface GoalData {
  goalName: string;
  targetAmount: number;
  activatedAt: string | null;
  isActive: boolean;
}

const ChiaGamingGoalOverlay = () => {
  const [goalData, setGoalData] = useState<GoalData | null>(null);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [pusherConfig, setPusherConfig] = useState<{ key: string; cluster: string } | null>(null);

  // Fetch Pusher config
  useEffect(() => {
    const fetchPusherConfig = async () => {
      const { data, error } = await supabase.functions.invoke('get-pusher-config', {
        body: { streamer_slug: 'chiaa_gaming' }
      });
      if (!error && data) {
        setPusherConfig({ key: data.key, cluster: data.cluster });
      }
    };
    fetchPusherConfig();
  }, []);

  // Fetch goal data and donations
  useEffect(() => {
    const fetchGoalData = async () => {
      const { data: streamerData } = await supabase
        .from('streamers')
        .select('goal_name, goal_target_amount, goal_activated_at, goal_is_active')
        .eq('id', '53190692-149e-4fa6-b4c4-1aed73510469')
        .single();

      if (streamerData) {
        setGoalData({
          goalName: streamerData.goal_name || '',
          targetAmount: streamerData.goal_target_amount || 0,
          activatedAt: streamerData.goal_activated_at,
          isActive: streamerData.goal_is_active || false,
        });

        if (streamerData.goal_is_active && streamerData.goal_activated_at) {
          const { data: donations } = await supabase
            .from('chiaa_gaming_donations')
            .select('amount, currency')
            .gte('created_at', streamerData.goal_activated_at)
            .in('payment_status', ['success', 'completed'])
            .in('moderation_status', ['approved', 'auto_approved']);

          const total = donations?.reduce((sum, d) => sum + convertToINR(Number(d.amount), d.currency || 'INR'), 0) || 0;
          setCurrentAmount(total);
        }
      }
    };

    fetchGoalData();
    const interval = setInterval(fetchGoalData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Pusher subscription for real-time updates
  useEffect(() => {
    if (!pusherConfig?.key) return;

    const pusher = new Pusher(pusherConfig.key, {
      cluster: pusherConfig.cluster,
    });

    const channel = pusher.subscribe('chiaa_gaming-goal');
    channel.bind('goal-progress', (data: { currentAmount: number; targetAmount: number }) => {
      setCurrentAmount(data.currentAmount);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('chiaa_gaming-goal');
      pusher.disconnect();
    };
  }, [pusherConfig]);

  if (!goalData?.isActive) {
    return null;
  }

  return (
    <GoalOverlay
      goalName={goalData.goalName}
      currentAmount={currentAmount}
      targetAmount={goalData.targetAmount}
    />
  );
};

export default ChiaGamingGoalOverlay;
