import React from 'react';
import { Gift, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface RewardsBannerProps {
  amount: number;
  currency: string;
}

const RewardsBanner: React.FC<RewardsBannerProps> = ({ amount, currency }) => {
  const isEligible = currency === 'INR' && amount >= 1000;
  const points = isEligible ? Math.floor(amount / 1000) * 50 : 0;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 px-3 py-2">
      <Gift className="h-4 w-4 shrink-0 text-yellow-400" />
      <span className="text-sm font-semibold text-yellow-300 flex-1">Earn Reward Points for Real Products</span>
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="shrink-0 rounded-full p-0.5 text-yellow-400/70 hover:text-yellow-300 transition-colors">
            <Info className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 bg-black/90 border-yellow-500/30 text-white" side="top">
          <div className="space-y-2 text-xs">
            <p className="text-white/70">₹1000 donation = 50 points</p>
            <p className="text-white/70">Points apply only to donations ₹1000+</p>
            <p className="text-sm font-bold">
              {isEligible ? (
                <span className="text-yellow-400">This donation will earn: {points} points ✨</span>
              ) : (
                <span className="text-white/50">No points earned</span>
              )}
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default RewardsBanner;
