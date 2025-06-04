
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Gift, Heart, Star, Award, Sparkles, Send } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import SignupDialog from './SignupDialog';

interface FloatingGift {
  id: number;
  type: 'gift' | 'heart' | 'star' | 'award';
  x: number;
  y: number;
  value: number;
  color: string;
  size: number;
}

const InteractiveGiftsSection: React.FC = () => {
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const [selectedGift, setSelectedGift] = useState<string>('gift');
  const [giftValue, setGiftValue] = useState([50]);
  const [floatingGifts, setFloatingGifts] = useState<FloatingGift[]>([]);
  const [totalSent, setTotalSent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const giftTypes = [
    { id: 'gift', icon: Gift, color: 'text-hyperchat-purple', name: 'Gift Box' },
    { id: 'heart', icon: Heart, color: 'text-hyperchat-pink', name: 'Heart' },
    { id: 'star', icon: Star, color: 'text-yellow-400', name: 'Star' },
    { id: 'award', icon: Award, color: 'text-orange-400', name: 'Trophy' },
  ];

  const sendGift = () => {
    setIsAnimating(true);
    const newGift: FloatingGift = {
      id: Date.now(),
      type: selectedGift as FloatingGift['type'],
      x: Math.random() * 80 + 10, // 10% to 90% of container width
      y: 100, // Start from bottom
      value: giftValue[0],
      color: giftTypes.find(g => g.id === selectedGift)?.color || 'text-hyperchat-purple',
      size: Math.min(Math.max(giftValue[0] / 10, 20), 60), // Size based on value
    };

    setFloatingGifts(prev => [...prev, newGift]);
    setTotalSent(prev => prev + giftValue[0]);

    // Remove gift after animation
    setTimeout(() => {
      setFloatingGifts(prev => prev.filter(g => g.id !== newGift.id));
      setIsAnimating(false);
    }, 3000);
  };

  // Auto-generate some gifts for demo
  useEffect(() => {
    const interval = setInterval(() => {
      if (floatingGifts.length < 3) {
        const randomGift = giftTypes[Math.floor(Math.random() * giftTypes.length)];
        const newGift: FloatingGift = {
          id: Date.now() + Math.random(),
          type: randomGift.id as FloatingGift['type'],
          x: Math.random() * 80 + 10,
          y: 100,
          value: [10, 25, 50, 100][Math.floor(Math.random() * 4)],
          color: randomGift.color,
          size: 30,
        };

        setFloatingGifts(prev => [...prev, newGift]);

        setTimeout(() => {
          setFloatingGifts(prev => prev.filter(g => g.id !== newGift.id));
        }, 3000);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [floatingGifts.length]);

  const getGiftIcon = (type: string) => {
    const giftType = giftTypes.find(g => g.id === type);
    return giftType ? giftType.icon : Gift;
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-transparent to-secondary/20">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
            Send Virtual Gifts Right Now
          </h2>
          <p className="text-muted-foreground md:text-xl max-w-3xl mx-auto">
            Try our interactive gift sending experience. Click, customize, and send virtual gifts to see how fans support their favorite creators.
          </p>
        </div>

        {/* Interactive Gift Sending Area */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-hyperchat-purple/20 to-hyperchat-pink/20 backdrop-blur-sm h-96 mb-8">
          {/* Floating Gifts Animation */}
          {floatingGifts.map((gift) => {
            const IconComponent = getGiftIcon(gift.type);
            return (
              <div
                key={gift.id}
                className={`absolute transition-all duration-3000 ease-out ${gift.color} animate-jump-out`}
                style={{
                  left: `${gift.x}%`,
                  bottom: `${gift.y - 100}%`,
                  fontSize: `${gift.size}px`,
                  transform: 'translate(-50%, 0)',
                }}
              >
                <IconComponent className="w-full h-full drop-shadow-lg" />
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-white text-sm font-bold bg-black/50 rounded px-2 py-1">
                  ₹{gift.value}
                </div>
              </div>
            );
          })}

          {/* Center Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="flex justify-center space-x-4 mb-6">
                <Sparkles className="h-16 w-16 text-yellow-400 animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Interactive Gift Experience</h3>
              <p className="text-white/80">Watch gifts float up as you send them!</p>
              <div className="text-hyperchat-pink font-bold text-lg">
                Total Sent: ₹{totalSent}
              </div>
            </div>
          </div>

          {/* Stats Display */}
          <div className="absolute top-4 left-4 bg-black/70 rounded-lg p-3">
            <div className="text-white text-sm font-medium">
              💫 Live Gift Demo
            </div>
          </div>

          <div className="absolute bottom-4 right-4 bg-black/70 rounded-lg p-3">
            <div className="text-white text-xs">
              <div>🎁 {floatingGifts.length} gifts floating</div>
              <div>💖 Interactive experience</div>
            </div>
          </div>
        </div>

        {/* Gift Control Panel */}
        <div className="bg-secondary/50 rounded-2xl p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4 text-center">Try Sending a Gift</h3>
          
          {/* Gift Type Selection */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {giftTypes.map((gift) => {
              const IconComponent = gift.icon;
              return (
                <button
                  key={gift.id}
                  onClick={() => setSelectedGift(gift.id)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                    selectedGift === gift.id
                      ? 'border-hyperchat-purple bg-hyperchat-purple/20'
                      : 'border-secondary bg-secondary/30 hover:border-hyperchat-purple/50'
                  }`}
                >
                  <IconComponent className={`h-8 w-8 mx-auto mb-2 ${gift.color}`} />
                  <div className="text-sm font-medium">{gift.name}</div>
                </button>
              );
            })}
          </div>

          {/* Value Slider */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Gift Value: ₹{giftValue[0]}
            </label>
            <Slider
              value={giftValue}
              onValueChange={setGiftValue}
              max={500}
              min={10}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>₹10</span>
              <span>₹500</span>
            </div>
          </div>

          {/* Send Button */}
          <div className="text-center">
            <Button
              onClick={sendGift}
              disabled={isAnimating}
              size="lg"
              className="bg-gradient-to-r from-hyperchat-purple to-hyperchat-pink hover:opacity-90 transition-opacity"
            >
              <Send className="w-4 h-4 mr-2" />
              {isAnimating ? 'Sending...' : `Send ₹${giftValue[0]} Gift`}
            </Button>
          </div>
        </div>

        {/* Gift Types Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="text-center p-4 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors cursor-pointer"
               onClick={() => setSelectedGift('gift')}>
            <Gift className="h-8 w-8 mx-auto mb-2 text-hyperchat-purple" />
            <div className="text-sm font-medium">Gift Boxes</div>
            <div className="text-xs text-muted-foreground">₹10 - ₹500</div>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors cursor-pointer"
               onClick={() => setSelectedGift('heart')}>
            <Heart className="h-8 w-8 mx-auto mb-2 text-hyperchat-pink" />
            <div className="text-sm font-medium">Hearts</div>
            <div className="text-xs text-muted-foreground">Show Love</div>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors cursor-pointer"
               onClick={() => setSelectedGift('star')}>
            <Star className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
            <div className="text-sm font-medium">Stars</div>
            <div className="text-xs text-muted-foreground">Appreciation</div>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors cursor-pointer"
               onClick={() => setSelectedGift('award')}>
            <Award className="h-8 w-8 mx-auto mb-2 text-orange-400" />
            <div className="text-sm font-medium">Trophies</div>
            <div className="text-xs text-muted-foreground">Achievements</div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-1 mb-6 rounded-full bg-secondary/80 text-muted-foreground">
            <span className="text-sm px-4 py-1">Interactive Virtual Gifts - Start at ₹10</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-hyperchat-purple to-hyperchat-pink hover:opacity-90 transition-opacity"
              onClick={() => setShowSignupDialog(true)}
            >
              Start Using Virtual Gifts
            </Button>
            <Button variant="outline" size="lg">
              View Gift Pricing
            </Button>
          </div>
        </div>
      </div>

      <SignupDialog open={showSignupDialog} onOpenChange={setShowSignupDialog} />
    </section>
  );
};

export default InteractiveGiftsSection;
