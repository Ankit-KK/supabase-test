import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

interface GoalOverlayProps {
  title?: string;
  goalName: string;
  currentAmount: number;
  targetAmount: number;
}

const GoalOverlay: React.FC<GoalOverlayProps> = ({
  title = "Goal Progress",
  goalName,
  currentAmount,
  targetAmount,
}) => {
  const percentage = Math.min((currentAmount / targetAmount) * 100, 100);
  const isGoalReached = currentAmount >= targetAmount;
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (isGoalReached && !showCelebration) {
      setShowCelebration(true);
    }
  }, [isGoalReached, showCelebration]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* FX Layer - Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="particle absolute rounded-full"
            style={{
              width: `${4 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 8}px`,
              left: `${10 + i * 12}%`,
              top: `${30 + Math.random() * 40}%`,
              background: i % 2 === 0 ? '#6C63FF' : '#00E5FF',
              boxShadow: i % 2 === 0 
                ? '0 0 10px rgba(108, 99, 255, 0.6)'
                : '0 0 10px rgba(0, 229, 255, 0.6)',
              animation: `particleFloat ${3 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-2xl px-8">
        {/* Header with Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#6C63FF] to-[#00E5FF] opacity-30 blur-md animate-pulse" />
            <Zap className="relative w-8 h-8 text-white drop-shadow-[0_0_8px_rgba(108,99,255,0.8)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              {title}
            </h1>
            <p className="text-base text-white/80 drop-shadow-md">{goalName}</p>
          </div>
        </div>

        {/* Progress Numbers */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xl font-semibold text-white drop-shadow-md">
            {formatAmount(currentAmount)} / {formatAmount(targetAmount)}
          </p>
          <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#6C63FF]/20 to-[#00E5FF]/20 border border-white/20 backdrop-blur-sm">
            <span className="text-lg font-bold text-white drop-shadow-md">
              {percentage.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="relative h-8 bg-white/10 rounded-full border border-white/20 overflow-hidden backdrop-blur-sm">
          {/* Progress Bar Fill */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#6C63FF] to-[#00E5FF] transition-all duration-1000 ease-out"
            style={{
              width: `${percentage}%`,
              boxShadow: '0 0 20px rgba(108, 99, 255, 0.8), 0 0 40px rgba(0, 229, 255, 0.6)',
              animation: 'neonPulse 2s ease-in-out infinite',
            }}
          >
            {/* Leading Edge Tick */}
            {percentage > 0 && percentage < 100 && (
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)] animate-pulse" />
            )}
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
                  background: i % 3 === 0 ? '#6C63FF' : i % 3 === 1 ? '#00E5FF' : '#ffffff',
                  left: '50%',
                  top: '50%',
                  animation: `confettiBurst 1.5s ease-out forwards`,
                  animationDelay: `${i * 0.05}s`,
                  transform: `rotate(${i * 18}deg) translateY(0)`,
                }}
              />
            ))}

            {/* Neon Ripple */}
            <div
              className="absolute rounded-full bg-gradient-to-r from-[#6C63FF] to-[#00E5FF] opacity-50"
              style={{
                width: '100px',
                height: '100px',
                animation: 'rippleExpand 1.5s ease-out infinite',
              }}
            />

            {/* Goal Reached Text */}
            <div className="relative mt-32">
              <h2 className="text-4xl font-bold text-white drop-shadow-[0_0_20px_rgba(108,99,255,1)] animate-pulse">
                GOAL REACHED! 🎉
              </h2>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes particleFloat {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.8;
          }
        }

        @keyframes neonPulse {
          0%, 100% {
            box-shadow: 0 0 10px rgba(108, 99, 255, 0.8), 0 0 20px rgba(108, 99, 255, 0.6);
          }
          50% {
            box-shadow: 0 0 20px rgba(0, 229, 255, 0.8), 0 0 40px rgba(0, 229, 255, 0.6);
          }
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
