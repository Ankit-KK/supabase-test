import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import GoalOverlay from '@/components/GoalOverlay';
import Pusher from 'pusher-js';
import { convertToINR } from '@/constants/currencies';

const ANKIT_STREAMER_ID = 'b111b82a-9fec-4e74-8a17-f81ee0e1c912'; // From streamers table

interface GoalData {
  goal_name: string;
  goal_target_amount: number;
  goal_activated_at: string;
  goal_is_active: boolean;
}

const AnkitGoalOverlay = () => {
  const [goalData, setGoalData] = useState<GoalData | null>(null);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [pusherConfig, setPusherConfig] = useState<{
    key: string;
    cluster: string;
  } | null>(null);
  const pusherRef = useRef<Pusher | null>(null);

  // Fetch Pusher config
  useEffect(() => {
    const fetchPusherConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-pusher-config', {
          body: { streamer_slug: 'ankit' }
        });

        if (error) throw error;
        if (data?.key && data?.cluster) {
          setPusherConfig({
            key: data.key,
            cluster: data.cluster,
          });
        }
      } catch (error) {
        console.error('Error fetching Pusher config:', error);
      }
    };

    fetchPusherConfig();
  }, []);

  // Fetch goal data and calculate progress
  const fetchGoalData = async () => {
    try {
      const { data: streamer, error } = await supabase
        .from('streamers')
        .select('goal_name, goal_target_amount, goal_activated_at, goal_is_active')
        .eq('id', ANKIT_STREAMER_ID)
        .single();

      if (error) throw error;

      // Only proceed if goal is active
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

      // Calculate donations since goal activation
      const { data: donations, error: donError } = await supabase
        .from('ankit_donations')
        .select('amount, currency')
        .eq('streamer_id', ANKIT_STREAMER_ID)
        .eq('payment_status', 'success')
        .eq('moderation_status', 'auto_approved')
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

    // Refresh every 30 seconds
    const interval = setInterval(fetchGoalData, 30000);

    return () => clearInterval(interval);
  }, []);

  // Setup Pusher for real-time updates
  useEffect(() => {
    if (!pusherConfig) return;
    
    // Prevent duplicate connections
    if (pusherRef.current) return;

    const pusher = new Pusher(pusherConfig.key, {
      cluster: pusherConfig.cluster,
    });
    
    pusherRef.current = pusher;

    const channel = pusher.subscribe('ankit-goal');

    channel.bind('goal-progress', (data: { currentAmount: number }) => {
      console.log('Goal progress update:', data);
      setCurrentAmount(data.currentAmount);
    });

    return () => {
      if (pusherRef.current) {
        try {
          channel.unbind_all();
          channel.unsubscribe();
          pusherRef.current.disconnect();
        } catch (e) {
          console.log('Pusher cleanup:', e);
        }
        pusherRef.current = null;
      }
    };
  }, [pusherConfig]);

  // Don't render anything if no active goal
  if (!goalData) {
    return null;
  }

  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden flex items-center justify-center">
      <GoalOverlay
        goalName={goalData.goal_name}
        currentAmount={currentAmount}
        targetAmount={goalData.goal_target_amount}
      />
    </div>
  );
};

export default AnkitGoalOverlay;
