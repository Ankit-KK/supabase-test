import React, { useEffect, useState } from 'react';
import hyperchatLogo from '@/assets/hyperchat-logo-short.png';

interface GoalOverlayProps {
  title?: string;
  goalName: string;
  currentAmount: number;
  targetAmount: number;
}

const GoalOverlay: React.FC<GoalOverlayProps> = ({
  goalName,
  currentAmount,
  targetAmount,
}) => {
  const [showLogo, setShowLogo] = useState(false);
  const percentage = Math.min((currentAmount / Math.max(targetAmount, 0.01)) * 100, 100);
  const isGoalReached = currentAmount >= targetAmount;
  const [showCelebration, setShowCelebration] = useState(false);

  // Toggle between logo and title every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setShowLogo(prev => !prev);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="relative w-[min(80vw,900px)]">
      {/* Goal Card */}
      <div 
        className="relative px-7 py-5 rounded-[1.25rem] text-white"
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(148, 163, 255, 0.28)',
          boxShadow: '0 18px 35px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Title Row */}
        <div className="flex items-center justify-between mb-3">
          {/* Title/Logo Toggle */}
          <div className="relative h-9 min-w-[200px]">
            <img 
              src={hyperchatLogo} 
              alt="HyperChat logo"
              className="absolute left-0 top-1/2 h-9 w-auto transition-all duration-400 ease-out"
              style={{
                opacity: showLogo ? 1 : 0,
                transform: `translateY(-50%) ${showLogo ? 'scale(1)' : 'scale(0.92)'}`,
              }}
            />
            <span 
              className="absolute left-0 top-1/2 text-[clamp(1.2rem,2.1vw,1.6rem)] font-semibold tracking-wider uppercase whitespace-nowrap transition-all duration-400 ease-out"
              style={{
                opacity: showLogo ? 0 : 1,
                transform: `translateY(-50%) ${showLogo ? 'translateY(-6px)' : 'translateY(0)'}`,
              }}
            >
              {goalName}
            </span>
          </div>
          
          {/* Amount Text */}
          <span className="text-sm opacity-95 ml-auto">
            {formatAmount(currentAmount)} / {formatAmount(targetAmount)}
          </span>
        </div>

        {/* Divider */}
        <div 
          className="w-full h-px mb-3"
          style={{ background: 'rgba(148, 163, 255, 0.35)' }}
        />

        {/* Progress Bar Track */}
        <div 
          className="relative w-full h-[18px] rounded-full overflow-hidden"
          style={{
            background: 'rgba(15, 23, 42, 1)',
            border: '1px solid rgba(148, 163, 255, 0.6)',
          }}
        >
          {/* Progress Fill */}
          <div
            className="relative h-full rounded-full transition-[width] duration-1000"
            style={{
              width: `${percentage}%`,
              background: 'linear-gradient(90deg, #6c63ff, #00e5ff)',
              boxShadow: '0 0 14px rgba(108, 99, 255, 0.8), 0 0 26px rgba(0, 229, 255, 0.7)',
              transitionTimingFunction: 'cubic-bezier(0.23, 0.9, 0.32, 1.01)',
            }}
          >
            {/* Shimmer Overlay */}
            <div 
              className="absolute inset-0 opacity-35 mix-blend-screen"
              style={{
                background: 'repeating-linear-gradient(120deg, rgba(255, 255, 255, 0.18) 0, rgba(255, 255, 255, 0.18) 5px, transparent 5px, transparent 10px)',
                animation: 'shimmer 1.3s linear infinite',
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
                background: i % 3 === 0 ? '#6C63FF' : i % 3 === 1 ? '#00E5FF' : '#ffffff',
                left: '50%',
                top: '50%',
                animation: `confettiBurst 1.5s ease-out ${i * 0.05}s forwards`,
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
