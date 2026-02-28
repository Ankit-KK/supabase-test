import React from 'react';
import { Gift } from 'lucide-react';

interface RewardsBannerProps {
  amount: number;
  currency: string;
}

const RewardsBanner: React.FC<RewardsBannerProps> = ({ amount, currency }) => {
  const isEligible = currency === 'INR' && amount >= 1000;
  const points = isEligible ? Math.floor(amount / 1000) * 50 : 0;

  return (
    <div className="rounded-lg border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <Gift className="h-4 w-4 text-yellow-400" />
        <span className="text-sm font-semibold text-yellow-300">Earn Reward Points for Real Products</span>
      </div>
      <div className="text-xs text-white/70 space-y-0.5">
        <p>₹1000 donation = 50 points</p>
        <p>Points apply only to donations ₹1000+</p>
      </div>
      <p className="text-sm font-bold">
        {isEligible ? (
          <span className="text-yellow-400">This donation will earn: {points} points ✨</span>
        ) : (
          <span className="text-white/50">No points earned</span>
        )}
      </p>
    </div>
  );
};

export default RewardsBanner;
