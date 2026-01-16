import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import GoalOverlay from '@/components/GoalOverlay';
import Pusher from 'pusher-js';
import { convertToINR } from '@/constants/currencies';

const THUNDERX_STREAMER_ID = 'f77658bf-d997-4112-8e71-9ca1cec5ccbe';

interface GoalData {
  goal_name: string;
  goal_target_amount: number;
  goal_activated_at: string;
  goal_is_active: boolean;
}

const ThunderXGoalOverlay = () => {
  const [goalData, setGoalData] = useState<GoalData | null>(null);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [brandColor, setBrandColor] = useState<string>('#6c63ff');
  const [pusherConfig, setPusherConfig] = useState<{
    key: string;
    cluster: string;
  } | null>(null);
  const pusherRef = useRef<Pusher | null>(null);

  useEffect(() => {
    const fetchPusherConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-pusher-config', {
          body: { streamer_slug: 'thunderx' }
        });

        if (error) throw error;
        if (data?.key && data?.cluster) {
          setPusherConfig({ key: data.key, cluster: data.cluster });
        }
      } catch (error) {
        console.error('Error fetching Pusher config:', error);
      }
    };

    fetchPusherConfig();
  }, []);

  const fetchGoalData = async () => {
    try {
      const { data: streamer, error } = await supabase
        .from('streamers')
        .select('goal_name, goal_target_amount, goal_activated_at, goal_is_active, brand_color')
        .eq('id', THUNDERX_STREAMER_ID)
        .single();

      if (error) throw error;

      if (streamer?.brand_color) {
        setBrandColor(streamer.brand_color);
      }

      if (!streamer?.goal_is_active || !streamer.goal_activated_at) {
        setGoalData(null);
        return;
      }

      setGoalData({
        goal_name: streamer.goal_name!,
        goal_target_amount: Number(streamer.goal_target_amount!),
        goal_activated_at: streamer.goal_activated_at,
        goal_is_active: streamer.goal_is_active,
      });

      const { data: donations, error: donError } = await supabase
        .from('thunderx_donations')
        .select('amount, currency')
        .eq('streamer_id', THUNDERX_STREAMER_ID)
        .eq('payment_status', 'success')
        .in('moderation_status', ['auto_approved', 'approved'])
        .gte('created_at', streamer.goal_activated_at);

      if (!donError && donations) {
        const total = donations.reduce((sum, d) => sum + convertToINR(Number(d.amount), d.currency || 'INR'), 0);
        setCurrentAmount(total);
      }
    } catch (error) {
      console.error('Error fetching goal data:', error);
    }
  };

  useEffect(() => {
    fetchGoalData();
    const interval = setInterval(fetchGoalData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!pusherConfig || pusherRef.current) return;

    const pusher = new Pusher(pusherConfig.key, { cluster: pusherConfig.cluster });
    pusherRef.current = pusher;

    const goalChannel = pusher.subscribe('thunderx-goal');
    goalChannel.bind('goal-progress', (data: { currentAmount: number }) => {
      setCurrentAmount(data.currentAmount);
    });

    const settingsChannel = pusher.subscribe('thunderx-settings');
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
          pusher.unsubscribe('thunderx-goal');
          pusher.unsubscribe('thunderx-settings');
          pusherRef.current.disconnect();
        } catch (e) {
          console.log('Pusher cleanup:', e);
        }
        pusherRef.current = null;
      }
    };
  }, [pusherConfig]);

  if (!goalData) return null;

  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden flex items-center justify-center">
      <GoalOverlay
        goalName={goalData.goal_name}
        currentAmount={currentAmount}
        targetAmount={goalData.goal_target_amount}
        brandColor={brandColor}
      />
    </div>
  );
};

export default ThunderXGoalOverlay;
