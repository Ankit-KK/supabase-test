import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface HyperEmotesSelectorProps {
  onHyperEmotesSelect: (enabled: boolean) => void;
  hyperEmotesEnabled: boolean;
  disabled?: boolean;
  minAmount: number;
  currentAmount: number;
  onExpandChange?: (expanded: boolean) => void;
}

const HyperEmotesSelector: React.FC<HyperEmotesSelectorProps> = ({
  onHyperEmotesSelect,
  hyperEmotesEnabled,
  disabled = false,
  minAmount,
  currentAmount,
  onExpandChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isEligible = currentAmount >= minAmount;
  const emoteCount = Math.min(50, Math.floor(currentAmount / 10));

  const handleToggleExpanded = () => {
    if (!isEligible) {
      toast({
        title: "Premium feature",
        description: `HyperEmotes require a donation of ₹${minAmount} or more`,
        variant: "destructive",
      });
      return;
    }
    
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpandChange?.(newExpanded);
  };

  const handleToggleHyperEmotes = () => {
    if (!isEligible) {
      toast({
        title: "Premium feature", 
        description: `HyperEmotes require a donation of ₹${minAmount} or more`,
        variant: "destructive",
      });
      return;
    }
    
    const newEnabled = !hyperEmotesEnabled;
    onHyperEmotesSelect(newEnabled);
    
    if (newEnabled) {
      toast({
        title: "HyperEmotes enabled! ✨",
        description: `${emoteCount} emojis will rain down during your donation!`,
      });
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        onClick={handleToggleExpanded}
        className={`w-full h-auto p-3 text-left justify-between ${
          !isEligible 
            ? 'opacity-50 cursor-not-allowed border-gray-400 text-gray-400' 
            : hyperEmotesEnabled
            ? 'border-purple-400 bg-purple-50 text-purple-700'
            : 'border-pink-300 text-gray-700 hover:border-pink-400'
        }`}
        disabled={disabled}
      >
        <div className="flex items-center space-x-2">
          <Sparkles className={`h-4 w-4 ${hyperEmotesEnabled ? 'text-purple-500' : 'text-pink-400'}`} />
          <div>
            <div className="font-medium text-xs">
              HyperEmotes {!isEligible && `(₹${minAmount}+ required)`}
            </div>
            <div className="text-xs opacity-80">
              {isEligible ? `${emoteCount} emoji rain` : `Requires ₹${minAmount}+ donation`}
            </div>
          </div>
        </div>
        <div className="text-xs">
          {isExpanded ? '▲' : '▼'}
        </div>
      </Button>

      {isExpanded && (
        <div className="bg-white/95 rounded-lg p-4 border border-purple-300 space-y-3 shadow-lg">
          <div className="text-center">
            <h3 className="font-bold text-purple-700 text-sm mb-2">✨ HyperEmotes ✨</h3>
            <p className="text-xs text-gray-600 mb-3">
              Trigger an epic emoji rain effect during your donation!
            </p>
            
            <div className="text-2xl mb-2">🚀 ✨ 🌟 👏 😍</div>
            
            {isEligible && (
              <p className="text-xs text-purple-600 font-medium mb-3">
                Your ₹{currentAmount} donation will trigger {emoteCount} emojis!
              </p>
            )}
          </div>

          <div className="flex justify-center space-x-2">
            <Button
              type="button"
              onClick={handleToggleHyperEmotes}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                hyperEmotesEnabled
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-200 hover:bg-purple-100 text-gray-700 hover:text-purple-700'
              }`}
              disabled={!isEligible}
            >
              {hyperEmotesEnabled ? (
                <div className="flex items-center space-x-1">
                  <X className="h-3 w-3" />
                  <span>Disable HyperEmotes</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <Sparkles className="h-3 w-3" />
                  <span>Enable HyperEmotes</span>
                </div>
              )}
            </Button>
          </div>

          {!isEligible && (
            <div className="text-center text-xs text-red-500 bg-red-50 rounded p-2">
              💡 Tip: Donate ₹{minAmount}+ to unlock HyperEmotes!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HyperEmotesSelector;