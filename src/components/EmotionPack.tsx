import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Sparkles } from 'lucide-react';
import { getAvailableEmotions, EMOTION_CONFIGS, EmotionConfig } from '@/utils/emotionParser';

interface EmotionPackProps {
  donationAmount: number;
  onEmotionSelect: (emotionTag: string) => void;
  className?: string;
}

export const EmotionPack: React.FC<EmotionPackProps> = ({
  donationAmount,
  onEmotionSelect,
  className = ''
}) => {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const availableEmotions = getAvailableEmotions(donationAmount);
  const allEmotions = Object.values(EMOTION_CONFIGS);

  const handleEmotionClick = (emotion: EmotionConfig) => {
    if (donationAmount >= emotion.minAmount) {
      setSelectedEmotion(emotion.name);
      onEmotionSelect(`[${emotion.name}]`);
      
      // Clear selection after a brief highlight
      setTimeout(() => setSelectedEmotion(null), 500);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'basic': return 'hsl(var(--primary))';
      case 'premium': return 'hsl(var(--secondary))';
      case 'vip': return 'hsl(var(--accent))';
      default: return 'hsl(var(--muted))';
    }
  };

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'basic': return 'default';
      case 'premium': return 'secondary';
      case 'vip': return 'destructive';
      default: return 'outline';
    }
  };

  const groupedEmotions = {
    basic: allEmotions.filter(e => e.tier === 'basic'),
    premium: allEmotions.filter(e => e.tier === 'premium'),
    vip: allEmotions.filter(e => e.tier === 'vip')
  };

  return (
    <Card className={`border-primary/20 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Emotion Pack
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            ₹{donationAmount} Tier
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Add emotions to your message by clicking the buttons below
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Basic Tier */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={getTierBadgeVariant('basic')} className="text-xs">
              Basic (≥₹1)
            </Badge>
            {donationAmount < 1 && (
              <Lock className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {groupedEmotions.basic.map((emotion) => {
              const isUnlocked = donationAmount >= emotion.minAmount;
              const isSelected = selectedEmotion === emotion.name;
              
              return (
                <Button
                  key={emotion.name}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  disabled={!isUnlocked}
                  onClick={() => handleEmotionClick(emotion)}
                  className={`h-auto p-2 flex flex-col items-center gap-1 transition-all ${
                    isSelected ? 'ring-2 ring-primary' : ''
                  } ${!isUnlocked ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                  title={isUnlocked ? emotion.description : `Requires ₹${emotion.minAmount} or more`}
                >
                  <span className="text-base">{emotion.icon}</span>
                  <span className="text-xs font-medium">{emotion.displayName}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Premium Tier */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={getTierBadgeVariant('premium')} className="text-xs">
              Premium (≥₹25)
            </Badge>
            {donationAmount < 25 && (
              <Lock className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {groupedEmotions.premium.map((emotion) => {
              const isUnlocked = donationAmount >= emotion.minAmount;
              const isSelected = selectedEmotion === emotion.name;
              
              return (
                <Button
                  key={emotion.name}
                  variant={isSelected ? "secondary" : "outline"}
                  size="sm"
                  disabled={!isUnlocked}
                  onClick={() => handleEmotionClick(emotion)}
                  className={`h-auto p-2 flex flex-col items-center gap-1 transition-all ${
                    isSelected ? 'ring-2 ring-secondary' : ''
                  } ${!isUnlocked ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                  title={isUnlocked ? emotion.description : `Requires ₹${emotion.minAmount} or more`}
                >
                  <span className="text-base">{emotion.icon}</span>
                  <span className="text-xs font-medium">{emotion.displayName}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* VIP Tier */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={getTierBadgeVariant('vip')} className="text-xs">
              VIP (≥₹100)
            </Badge>
            {donationAmount < 100 && (
              <Lock className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {groupedEmotions.vip.map((emotion) => {
              const isUnlocked = donationAmount >= emotion.minAmount;
              const isSelected = selectedEmotion === emotion.name;
              
              return (
                <Button
                  key={emotion.name}
                  variant={isSelected ? "destructive" : "outline"}
                  size="sm"
                  disabled={!isUnlocked}
                  onClick={() => handleEmotionClick(emotion)}
                  className={`h-auto p-2 flex flex-col items-center gap-1 transition-all ${
                    isSelected ? 'ring-2 ring-destructive' : ''
                  } ${!isUnlocked ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                  title={isUnlocked ? emotion.description : `Requires ₹${emotion.minAmount} or more`}
                >
                  <span className="text-base">{emotion.icon}</span>
                  <span className="text-xs font-medium">{emotion.displayName}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Click emotion buttons to insert tags like [laughing] into your message. 
            You can mix multiple emotions in one message!
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Example: "That was amazing [laughing] but also scary [dramatically]"
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmotionPack;