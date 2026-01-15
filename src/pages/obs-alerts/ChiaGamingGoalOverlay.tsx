import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Pusher from 'pusher-js';
import { convertToINR } from '@/constants/currencies';
import hyperchatLogo from '@/assets/hyperchat-logo-short.png';

interface GoalData {
  goalName: string;
  targetAmount: number;
  activatedAt: string | null;
  isActive: boolean;
}

// Helper functions for color manipulation
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const hexToDarkBg = (hex: string) => {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 180);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 180);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 180);
  return `rgb(${r}, ${g}, ${b})`;
};

const hexToLightVariant = (hex: string) => {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + 40);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + 40);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + 40);
  return `rgb(${r}, ${g}, ${b})`;
};

const ChiaGamingGoalOverlay = () => {
  const [goalData, setGoalData] = useState<GoalData | null>(null);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [brandColor, setBrandColor] = useState('#ec4899');
  const [pusherConfig, setPusherConfig] = useState<{ key: string; cluster: string } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

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
        .select('goal_name, goal_target_amount, goal_activated_at, goal_is_active, brand_color')
        .eq('id', '53190692-149e-4fa6-b4c4-1aed73510469')
        .single();

      if (streamerData) {
        setGoalData({
          goalName: streamerData.goal_name || '',
          targetAmount: streamerData.goal_target_amount || 0,
          activatedAt: streamerData.goal_activated_at,
          isActive: streamerData.goal_is_active || false,
        });

        if (streamerData.brand_color) {
          setBrandColor(streamerData.brand_color);
        }

        if (streamerData.goal_is_active && streamerData.goal_activated_at) {
          const { data: donations } = await supabase
            .from('chiaa_gaming_donations')
            .select('amount, currency')
            .gte('created_at', streamerData.goal_activated_at)
            .eq('payment_status', 'success')
            .eq('moderation_status', 'auto_approved');

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

    const goalChannel = pusher.subscribe('chiaa_gaming-goal');
    goalChannel.bind('goal-progress', (data: { currentAmount: number; targetAmount: number }) => {
      setCurrentAmount(data.currentAmount);
    });

    const settingsChannel = pusher.subscribe('chiaa_gaming-settings');
    settingsChannel.bind('settings-updated', (data: any) => {
      if (data.brand_color) {
        setBrandColor(data.brand_color);
      }
    });

    return () => {
      goalChannel.unbind_all();
      settingsChannel.unbind_all();
      pusher.unsubscribe('chiaa_gaming-goal');
      pusher.unsubscribe('chiaa_gaming-settings');
      pusher.disconnect();
    };
  }, [pusherConfig]);

  // Check for goal completion and show celebration
  const percentage = goalData?.targetAmount ? Math.min((currentAmount / goalData.targetAmount) * 100, 100) : 0;
  const isGoalReached = percentage >= 100;

  useEffect(() => {
    if (isGoalReached && !showCelebration) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 5000);
    }
  }, [isGoalReached]);

  if (!goalData?.isActive) {
    return null;
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCompactTarget = (amount: number) => {
    if (amount >= 100000) {
      return `${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
  };

  return (
    <div className="fixed inset-0 flex items-end justify-center pb-8 pointer-events-none">
      <div 
        className="w-[90%] max-w-lg p-4 rounded-xl relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${hexToDarkBg(brandColor)} 0%, rgba(0,0,0,0.9) 100%)`,
          boxShadow: `0 8px 32px ${hexToRgba(brandColor, 0.3)}`,
          border: `2px solid ${hexToRgba(brandColor, 0.4)}`,
        }}
      >
        {/* HyperChat Logo */}
        <div className="absolute top-2 right-2 opacity-60">
          <img src={hyperchatLogo} alt="HyperChat" className="h-5" />
        </div>

        {/* Goal Name */}
        <div className="text-center mb-3">
          <h3 
            className="text-lg font-bold"
            style={{ color: brandColor }}
          >
            {goalData.goalName}
          </h3>
        </div>

        {/* Progress Bar */}
        <div className="relative h-8 rounded-full overflow-hidden mb-2"
          style={{ 
            background: hexToRgba(brandColor, 0.2),
            border: `1px solid ${hexToRgba(brandColor, 0.3)}`,
          }}
        >
          <div 
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
            style={{ 
              width: `${percentage}%`,
              background: `linear-gradient(90deg, ${brandColor} 0%, ${hexToLightVariant(brandColor)} 100%)`,
            }}
          >
            {/* Shimmer effect */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                animation: 'shimmer 2s infinite',
              }}
            />
          </div>

          {/* Amount text on progress bar */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-sm drop-shadow-lg">
              {formatAmount(currentAmount)} / ₹{formatCompactTarget(goalData.targetAmount)}
            </span>
          </div>
        </div>

        {/* Percentage */}
        <div className="text-center">
          <span 
            className="text-2xl font-bold"
            style={{ color: brandColor }}
          >
            {percentage.toFixed(1)}%
          </span>
        </div>

        {/* Celebration Animation */}
        {showCelebration && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: i % 2 === 0 ? brandColor : hexToLightVariant(brandColor),
                  animation: `confetti-burst 1s ease-out forwards`,
                  animationDelay: `${Math.random() * 0.5}s`,
                }}
              />
            ))}
            <div 
              className="absolute inset-0 rounded-xl"
              style={{
                border: `3px solid ${brandColor}`,
                animation: 'ripple-expand 1s ease-out forwards',
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span 
                className="text-4xl font-bold animate-bounce"
                style={{ color: brandColor }}
              >
                🎉 GOAL REACHED! 🎉
              </span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes confetti-burst {
          0% { transform: scale(0) translateY(0); opacity: 1; }
          100% { transform: scale(1) translateY(-100px); opacity: 0; }
        }
        @keyframes ripple-expand {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.1); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default ChiaGamingGoalOverlay;
