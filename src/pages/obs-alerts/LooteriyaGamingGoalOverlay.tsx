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

// Color helper functions
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const hexToDarkBg = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const darkR = Math.floor(r * 0.15 + 20);
  const darkG = Math.floor(g * 0.1 + 10);
  const darkB = Math.floor(b * 0.2 + 30);
  return `rgba(${darkR}, ${darkG}, ${darkB}, ${alpha})`;
};

const hexToLightVariant = (hex: string) => {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + 60);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + 60);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + 60);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const LooteriyaGamingGoalOverlay = () => {
  const [goalData, setGoalData] = useState<GoalData | null>(null);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [brandColor, setBrandColor] = useState<string>("#9333ea"); // Default purple
  const [pusherConfig, setPusherConfig] = useState<{
    key: string;
    cluster: string;
  } | null>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Derived colors from brandColor
  const lightColor = hexToLightVariant(brandColor);

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
        .select("goal_name, goal_target_amount, goal_activated_at, goal_is_active, brand_color")
        .eq("id", LOOTERIYA_GAMING_STREAMER_ID)
        .single();

      if (error) throw error;

      // Update brand color if available
      if (streamer?.brand_color) {
        setBrandColor(streamer.brand_color);
      }

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
        .in("moderation_status", ["auto_approved", "approved"])
        .gte("created_at", streamer.goal_activated_at);

      if (!donError && donations) {
        const total = donations.reduce((sum, d) => sum + convertToINR(Number(d.amount), d.currency || "INR"), 0);
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

    // Subscribe to goal progress channel
    const goalChannel = pusher.subscribe("looteriya_gaming-goal");
    goalChannel.bind("goal-progress", (data: { currentAmount: number }) => {
      console.log("Goal progress update:", data);
      setCurrentAmount(data.currentAmount);
    });

    // Subscribe to settings channel for brand color updates
    const settingsChannel = pusher.subscribe("looteriya_gaming-settings");
    settingsChannel.bind("settings-updated", (rawData: any) => {
      console.log("[GoalOverlay] Settings update received:", rawData);
      const data = typeof rawData === "string" ? JSON.parse(rawData) : rawData;
      if (data.brand_color) {
        setBrandColor(data.brand_color);
      }
    });

    return () => {
      if (pusherRef.current) {
        try {
          goalChannel.unbind_all();
          goalChannel.unsubscribe();
          settingsChannel.unbind_all();
          settingsChannel.unsubscribe();
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
      return { number: `₹${formatted}`, suffix: "k" };
    }
    return { number: `₹${amount}`, suffix: "" };
  };

  // Don't render anything if no active goal
  if (!goalData) {
    return null;
  }

  const percentage = Math.min((currentAmount / Math.max(goalData.goal_target_amount, 0.01)) * 100, 100);

  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden flex items-center justify-center">
      <div className="relative w-[min(80vw,900px)]">
        {/* Goal Card - Dynamic Brand Color Theme */}
        <div
          className="relative px-7 py-5 rounded-[1.25rem] text-white"
          style={{
            background: hexToDarkBg(brandColor, 0.95),
            border: `1px solid ${hexToRgba(brandColor, 0.4)}`,
            boxShadow: `0 18px 35px rgba(0, 0, 0, 0.6), 0 0 40px ${hexToRgba(brandColor, 0.3)}`,
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

            {/* Amount Text - positioned 25% right from center */}
            <span className="text-5xl font-black opacity-95 absolute left-[75%] transform -translate-x-1/2 whitespace-nowrap drop-shadow-lg">
              <span className="font-extrabold">{formatAmount(currentAmount)}</span>
              {" / "}
              {(() => {
                const target = formatCompactTarget(goalData.goal_target_amount);
                return (
                  <span className="text-4xl font-normal opacity-60">
                    {target.number}
                    {target.suffix}
                  </span>
                );
              })()}
            </span>
          </div>

          {/* Divider */}
          <div className="w-full h-px mb-3" style={{ background: hexToRgba(brandColor, 0.35) }} />

          {/* Progress Bar Track */}
          <div
            className="relative w-full h-[18px] rounded-full overflow-hidden"
            style={{
              background: hexToDarkBg(brandColor, 1),
              border: `1px solid ${hexToRgba(brandColor, 0.6)}`,
            }}
          >
            {/* Progress Fill - Dynamic Gradient */}
            <div
              className="relative h-full rounded-full transition-[width] duration-1000"
              style={{
                width: `${percentage}%`,
                background: `linear-gradient(90deg, ${brandColor}, ${lightColor})`,
                boxShadow: `0 0 14px ${hexToRgba(brandColor, 0.8)}, 0 0 26px ${hexToRgba(lightColor, 0.7)}`,
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

        {/* Goal Reached Celebration */}
        {showCelebration && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Confetti Particles */}
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  background: i % 3 === 0 ? brandColor : i % 3 === 1 ? lightColor : "#ffffff",
                  left: "50%",
                  top: "50%",
                  animation: `confettiBurst 1.5s ease-out ${i * 0.05}s forwards`,
                  transform: `rotate(${i * 18}deg) translateY(0)`,
                }}
              />
            ))}

            {/* Neon Ripple */}
            <div
              className="absolute rounded-full opacity-50"
              style={{
                width: "100px",
                height: "100px",
                background: `linear-gradient(to right, ${brandColor}, ${lightColor})`,
                animation: "rippleExpand 1.5s ease-out infinite",
              }}
            />

            {/* Goal Reached Text */}
            <div className="relative mt-32">
              <h2 
                className="text-4xl font-bold text-white animate-pulse"
                style={{ textShadow: `0 0 20px ${brandColor}` }}
              >
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
