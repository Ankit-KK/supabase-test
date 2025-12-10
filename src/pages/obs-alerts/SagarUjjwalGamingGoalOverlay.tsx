import React, { useState, useEffect } from 'react';
import GoalOverlay from '@/components/GoalOverlay';
import { supabase } from '@/integrations/supabase/client';
import Pusher from 'pusher-js';

interface GoalData {
  goalName: string;
  targetAmount: number;
  activatedAt: string | null;
  isActive: boolean;
}

const SagarUjjwalGamingGoalOverlay = () => {
  const [goalData, setGoalData] = useState<GoalData | null>(null);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [pusherConfig, setPusherConfig] = useState<{ key: string; cluster: string } | null>(null);

  useEffect(() => {
    const fetchPusherConfig = async () => {
      const { data, error } = await supabase.functions.invoke('get-pusher-config', {
        body: { streamer_slug: 'sagarujjwalgaming' }
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
        .select('goal_name, goal_target_amount, goal_activated_at, goal_is_active')
        .eq('id', '4836e53e-0677-4432-ab79-46ad98203625')
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
            .from('sagarujjwalgaming_donations')
            .select('amount')
            .gte('created_at', streamerData.goal_activated_at)
            .in('payment_status', ['success', 'completed'])
            .in('moderation_status', ['approved', 'auto_approved']);

          const total = donations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
          setCurrentAmount(total);
        }
      }
    };

    fetchGoalData();
    const interval = setInterval(fetchGoalData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!pusherConfig?.key) return;

    const pusher = new Pusher(pusherConfig.key, {
      cluster: pusherConfig.cluster,
    });

    const channel = pusher.subscribe('sagarujjwalgaming-goal');
    channel.bind('goal-progress', (data: { currentAmount: number; targetAmount: number }) => {
      setCurrentAmount(data.currentAmount);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('sagarujjwalgaming-goal');
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

export default SagarUjjwalGamingGoalOverlay;
