import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import Pusher from "pusher-js";
import hyperchatLogo from "@/assets/hyperchat-logo-short.png";
import { convertToINR } from "@/constants/currencies";

const LOOTERIYA_GAMING_STREAMER_ID = "cfa7c983-be49-4be0-ab99-d20fd4301a11";

interface GoalData {
  goal_name: string;
  goal_target_amount: number;
  goal_activated_at: string;
  goal_is_active: boolean;
}

const LooteriyaGamingGoalOverlay = () => {
  const [goalData, setGoalData] = useState<GoalData | null>(null);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [pusherConfig, setPusherConfig] = useState<{
    key: string;
    cluster: string;
  } | null>(null);
  const pusherRef = useRef<Pusher | null>(null);
  // Logo is now always visible (static display)
  const [showCelebration, setShowCelebration] = useState(false);

  // Fetch Pusher config
  useEffect(() => {
    const fetchPusherConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-pusher-config", {
          body: { streamer_slug: "looteriya_gaming" },
        });

        if (error) throw error;
        if (data?.key && data?.cluster) {
          setPusherConfig({
            key: data.key,
            cluster: data.cluster,
          });
        }
      } catch (error) {
        console.error("Error fetching Pusher config:", error);
      }
    };

    fetchPusherConfig();
  }, []);

  // Fetch goal data and calculate progress
  const fetchGoalData = async () => {
    try {
      const { data: streamer, error } = await supabase
        .from("streamers")
        .select("goal_name, goal_target_amount, goal_activated_at, goal_is_active")
        .eq("id", LOOTERIYA_GAMING_STREAMER_ID)
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
        .from("looteriya_gaming_donations")
        .select("amount, currency")
        .eq("streamer_id", LOOTERIYA_GAMING_STREAMER_ID)
        .eq("payment_status", "success")
        .gte("created_at", streamer.goal_activated_at);

      if (!donError && donations) {
        const total = donations.reduce((sum, d) => sum + convertToINR(Number(d.amount), d.currency || 'INR'), 0);
        setCurrentAmount(total);
      }
    } catch (error) {
      console.error("Error fetching goal data:", error);
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

    const channel = pusher.subscribe("looteriya_gaming-goal");

    channel.bind("goal-progress", (data: { currentAmount: number }) => {
      console.log("Goal progress update:", data);
      setCurrentAmount(data.currentAmount);
    });

    return () => {
      if (pusherRef.current) {
        try {
          channel.unbind_all();
          channel.unsubscribe();
          pusherRef.current.disconnect();
        } catch (e) {
          console.log("Pusher cleanup:", e);
        }
        pusherRef.current = null;
      }
    };
  }, [pusherConfig]);

  // Check if goal is reached
  const isGoalReached = goalData ? currentAmount >= goalData.goal_target_amount : false;

  useEffect(() => {
    if (isGoalReached && !showCelebration) {
      setShowCelebration(true);
    }
  }, [isGoalReached, showCelebration]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCompactTarget = (amount: number) => {
    if (amount >= 1000) {
      const thousands = amount / 1000;
      const formatted = thousands % 1 === 0 ? thousands.toString() : thousands.toFixed(1);
      return { number: `₹${formatted}`, suffix: 'k' };
    }
    return { number: `₹${amount}`, suffix: '' };
  };

  // Don't render anything if no active goal
  if (!goalData) {
    return null;
  }

  const percentage = Math.min((currentAmount / Math.max(goalData.goal_target_amount, 0.01)) * 100, 100);

  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden flex items-center justify-center">
      <div className="relative w-[min(80vw,900px)]">
        {/* Goal Card - Purple Theme */}
        <div
          className="relative px-7 py-5 rounded-[1.25rem] text-white"
          style={{
            background: "rgba(45, 20, 60, 0.75)",
            border: "1px solid rgba(168, 85, 247, 0.4)",
            boxShadow: "0 18px 35px rgba(0, 0, 0, 0.6), 0 0 40px rgba(147, 51, 234, 0.3)",
          }}
        >
          {/* Title Row */}
          <div className="flex items-center mb-3">
            {/* Static Logo + Goal Name */}
            <div className="flex items-center gap-4">
              <img src={hyperchatLogo} alt="HyperChat logo" className="h-10 w-auto" />
              <span className="text-[clamp(1.2rem,2.1vw,1.6rem)] font-semibold tracking-wider uppercase whitespace-nowrap">
                {goalData.goal_name}
              </span>
            </div>

            <span className="text-5xl absolute left-[75%] transform -translate-x-1/2 whitespace-nowrap drop-shadow-lg">
  <span className="font-extrabold text-white">
    {formatAmount(currentAmount)}
  </span>
  <span className="text-3xl opacity-60 ml-2">
    /
    {(() => {
      const target = formatCompactTarget(goalData.goal_target_amount);
      return ` ${target.number}${target.suffix}`;
    })()}
  </span>
</span>


          {/* Divider - Purple */}
          <div className="w-full h-px mb-3" style={{ background: "rgba(168, 85, 247, 0.35)" }} />

          {/* Progress Bar Track - Purple */}
          <div
            className="relative w-full h-[18px] rounded-full overflow-hidden"
            style={{
              background: "rgba(30, 15, 40, 1)",
              border: "1px solid rgba(168, 85, 247, 0.6)",
            }}
          >
            {/* Progress Fill - Purple Gradient */}
            <div
              className="relative h-full rounded-full transition-[width] duration-1000"
              style={{
                width: `${percentage}%`,
                background: "linear-gradient(90deg, #9333ea, #c084fc)",
                boxShadow: "0 0 14px rgba(147, 51, 234, 0.8), 0 0 26px rgba(192, 132, 252, 0.7)",
                transitionTimingFunction: "cubic-bezier(0.23, 0.9, 0.32, 1.01)",
              }}
            >
              {/* Shimmer Overlay */}
              <div
                className="absolute inset-0 opacity-35 mix-blend-screen"
                style={{
                  background:
                    "repeating-linear-gradient(120deg, rgba(255, 255, 255, 0.18) 0, rgba(255, 255, 255, 0.18) 5px, transparent 5px, transparent 10px)",
                  animation: "shimmer 1.3s linear infinite",
                }}
              />
            </div>
          </div>
        </div>

        {/* Goal Reached Celebration - Purple */}
        {showCelebration && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Confetti Particles */}
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  background: i % 3 === 0 ? "#9333ea" : i % 3 === 1 ? "#c084fc" : "#ffffff",
                  left: "50%",
                  top: "50%",
                  animation: `confettiBurst 1.5s ease-out ${i * 0.05}s forwards`,
                  transform: `rotate(${i * 18}deg) translateY(0)`,
                }}
              />
            ))}

            {/* Neon Ripple - Purple */}
            <div
              className="absolute rounded-full bg-gradient-to-r from-[#9333ea] to-[#c084fc] opacity-50"
              style={{
                width: "100px",
                height: "100px",
                animation: "rippleExpand 1.5s ease-out infinite",
              }}
            />

            {/* Goal Reached Text */}
            <div className="relative mt-32">
              <h2 className="text-4xl font-bold text-white drop-shadow-[0_0_20px_rgba(147,51,234,1)] animate-pulse">
                GOAL REACHED! 🎉
              </h2>
            </div>
          </div>
        )}

        {/* CSS Animations */}
        <style>{`
          @keyframes shimmer {
            from { transform: translateX(-20%); }
            to { transform: translateX(20%); }
          }

          @keyframes confettiBurst {
            0% {
              transform: translate(-50%, -50%) rotate(0deg) translateY(0) scale(1);
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -50%) rotate(720deg) translateY(-300px) scale(0.5);
              opacity: 0;
            }
          }

          @keyframes rippleExpand {
            0% {
              transform: scale(0);
              opacity: 0.6;
            }
            100% {
              transform: scale(8);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default LooteriyaGamingGoalOverlay;
