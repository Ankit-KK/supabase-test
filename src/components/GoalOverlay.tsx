import React, { useEffect, useState } from "react";
import hyperchatLogo from "@/assets/hyperchat-logo-short.png";

interface GoalOverlayProps {
  title?: string;
  goalName: string;
  currentAmount: number;
  targetAmount: number;
  brandColor?: string;
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
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

const GoalOverlay: React.FC<GoalOverlayProps> = ({
  goalName,
  currentAmount,
  targetAmount,
  brandColor = "#6c63ff", // Default blue/purple color
}) => {
  const percentage = Math.min((currentAmount / Math.max(targetAmount, 0.01)) * 100, 100);
  const isGoalReached = currentAmount >= targetAmount;
  const [showCelebration, setShowCelebration] = useState(false);

  // Derived colors from brandColor
  const lightColor = hexToLightVariant(brandColor);

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

  return (
    <div className="relative w-[min(80vw,900px)]">
      {/* Goal Card */}
      <div
        className="relative px-7 py-5 rounded-[1.25rem] text-white"
        style={{
          background: hexToDarkBg(brandColor, 0.95),
          border: `1px solid ${hexToRgba(brandColor, 0.4)}`,
          boxShadow: `0 18px 35px rgba(0, 0, 0, 0.6), 0 0 40px ${hexToRgba(brandColor, 0.3)}`,
        }}
      >
        {/* Title Row */}
        <div className="flex items-center justify-between mb-3">
          {/* Static Logo + Goal Name */}
          <div className="flex items-center gap-4">
            <img src={hyperchatLogo} alt="HyperChat logo" className="h-14 w-auto" />
            <span className="text-[clamp(1.2rem,2.1vw,1.6rem)] font-semibold tracking-wider uppercase whitespace-nowrap">
              {goalName}
            </span>
          </div>

          <div className="text-3xl font-semibold ml-auto flex items-center gap-1">
  <span>{formatAmount(currentAmount)}</span>
  <span className="opacity-60">/</span>
  <span className="opacity-60">{formatAmount(targetAmount)}</span>
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
          {/* Progress Fill */}
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
  );
};

export default GoalOverlay;
