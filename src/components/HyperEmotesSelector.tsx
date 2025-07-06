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
        className={`w-full h-auto p-4 text-left justify-between transform transition-all duration-300 hover:scale-105 ${
          !isEligible 
            ? 'opacity-50 cursor-not-allowed border-gray-400 text-gray-400 bg-white/70' 
            : hyperEmotesEnabled
            ? 'border-purple-400 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 shadow-lg animate-pulse'
            : 'border-2 border-purple-300 text-gray-700 hover:border-purple-400 bg-gradient-to-r from-white to-purple-50 hover:shadow-lg'
        }`}
        disabled={disabled}
      >
        <div className="flex items-center space-x-3">
          <Sparkles className={`h-6 w-6 ${hyperEmotesEnabled ? 'text-purple-500 animate-spin' : 'text-purple-400'}`} />
          <div>
            <div className="font-bold text-sm flex items-center gap-2">
              ✨ HyperEmotes ✨ {!isEligible && `(₹${minAmount}+ required)`}
            </div>
            <div className="text-sm opacity-90 font-medium">
              {isEligible ? `🚀 ${emoteCount} emoji rain effect` : `🔒 Requires ₹${minAmount}+ donation`}
            </div>
          </div>
        </div>
        <div className="text-lg font-bold">
          {isExpanded ? '▲' : '▼'}
        </div>
      </Button>

      {isExpanded && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-300 space-y-4 shadow-xl animate-fade-in">
          <div className="text-center">
            <h3 className="font-bold text-purple-700 text-lg mb-3 flex items-center justify-center gap-2">
              ✨ HyperEmotes Experience ✨
            </h3>
            <p className="text-sm text-gray-700 mb-4 font-medium">
              Trigger an EPIC emoji rain effect during your donation!
            </p>
            
            <div className="text-4xl mb-4 animate-bounce">🚀 ✨ 🌟 👏 😍 🎉 💫 🔥</div>
            
            {isEligible && (
              <div className="bg-purple-100 rounded-lg p-3 mb-4">
                <p className="text-sm text-purple-700 font-bold">
                  🎯 Your ₹{currentAmount} donation will trigger {emoteCount} emojis cascading down!
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-center space-x-3">
            <Button
              type="button"
              onClick={handleToggleHyperEmotes}
              className={`px-6 py-3 text-sm font-bold rounded-xl transition-all transform hover:scale-105 ${
                hyperEmotesEnabled
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg'
                  : 'bg-gradient-to-r from-gray-200 to-purple-200 hover:from-purple-200 hover:to-pink-200 text-gray-700 hover:text-purple-700'
              }`}
              disabled={!isEligible}
            >
              {hyperEmotesEnabled ? (
                <div className="flex items-center space-x-2">
                  <X className="h-4 w-4" />
                  <span>Disable HyperEmotes</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Enable HyperEmotes</span>
                </div>
              )}
            </Button>
          </div>

          {!isEligible && (
            <div className="text-center text-sm text-red-600 bg-red-100 rounded-lg p-3 font-medium border border-red-200">
              💡 Tip: Donate ₹{minAmount}+ to unlock this amazing HyperEmotes experience!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HyperEmotesSelector;