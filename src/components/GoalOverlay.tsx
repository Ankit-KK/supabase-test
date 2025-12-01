import React, { useEffect, useState } from 'react';

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
    <div className="relative w-full">
      {/* Goal Name */}
      <p className="text-sm text-white/90 mb-1 drop-shadow-md">{goalName}</p>
      
      {/* Amount Display */}
      <p className="text-base font-medium text-white mb-2 drop-shadow-md">
        {formatAmount(currentAmount)} / {formatAmount(targetAmount)}
      </p>
      
      {/* Slim Progress Bar */}
      <div className="relative h-3 bg-white/10 rounded-full border border-white/20 overflow-hidden backdrop-blur-sm">
        {/* Progress Bar Fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#6C63FF] to-[#00E5FF] transition-all duration-1000 ease-out"
          style={{
            width: `${percentage}%`,
            boxShadow: '0 0 15px rgba(108, 99, 255, 0.6), 0 0 30px rgba(0, 229, 255, 0.4)',
          }}
        >
          {/* Leading Edge Tick */}
          {percentage > 0 && percentage < 100 && (
            <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
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
