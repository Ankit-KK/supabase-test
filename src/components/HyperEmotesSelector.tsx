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
            ? 'opacity-50 cursor-not-allowed border-gray-400 text-gray-400 bg-white/70' 
            : hyperEmotesEnabled
            ? 'border-2 border-purple-500 bg-gradient-to-r from-purple-200 to-pink-200 text-purple-800 shadow-md'
            : 'border-2 border-purple-400 text-purple-700 hover:border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100'
        }`}
        disabled={disabled}
      >
        <div className="flex items-center space-x-2">
          <Sparkles className={`h-4 w-4 ${hyperEmotesEnabled ? 'text-purple-600' : 'text-purple-500'}`} />
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
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-300 space-y-3 shadow-lg">
          <div className="text-center">
            <h3 className="font-bold text-purple-700 text-sm mb-2">✨ HyperEmotes ✨</h3>
            <p className="text-xs text-purple-600 mb-3">
              Trigger an epic emoji rain effect during your donation!
            </p>
            
            <div className="text-2xl mb-2">🚀 ✨ 🌟 👏 😍</div>
            
            {isEligible && (
              <p className="text-xs text-purple-700 font-medium mb-3 bg-purple-100 rounded p-2">
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
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white'
                  : 'bg-gradient-to-r from-purple-200 to-pink-200 hover:from-purple-300 hover:to-pink-300 text-purple-700 hover:text-purple-800'
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
            <div className="text-center text-xs text-red-600 bg-red-100 rounded p-2 border border-red-300">
              💡 Tip: Donate ₹{minAmount}+ to unlock HyperEmotes!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HyperEmotesSelector;