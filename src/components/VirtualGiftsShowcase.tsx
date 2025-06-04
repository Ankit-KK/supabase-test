
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Gift, Heart, Star, Award } from 'lucide-react';
import SignupDialog from './SignupDialog';

const VirtualGiftsShowcase: React.FC = () => {
  const [showSignupDialog, setShowSignupDialog] = useState(false);

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-transparent to-secondary/20">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
            Experience Virtual Gifting in 3D
          </h2>
          <p className="text-muted-foreground md:text-xl max-w-3xl mx-auto">
            Let fans send beautiful virtual gifts during live streams. Interactive 3D gifts that bring excitement and support to your content.
          </p>
        </div>

        {/* Placeholder for 3D Scene - will be replaced once Three.js is working */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-hyperchat-purple/20 to-hyperchat-pink/20 backdrop-blur-sm">
          <div className="h-96 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="flex justify-center space-x-4 mb-6">
                <div className="animate-bounce" style={{ animationDelay: '0s' }}>
                  <Gift className="h-12 w-12 text-hyperchat-purple" />
                </div>
                <div className="animate-bounce" style={{ animationDelay: '0.2s' }}>
                  <Heart className="h-12 w-12 text-hyperchat-pink" />
                </div>
                <div className="animate-bounce" style={{ animationDelay: '0.4s' }}>
                  <Star className="h-12 w-12 text-yellow-400" />
                </div>
                <div className="animate-bounce" style={{ animationDelay: '0.6s' }}>
                  <Award className="h-12 w-12 text-orange-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Interactive 3D Gifts Coming Soon!</h3>
              <p className="text-white/80">Experience virtual gifting like never before</p>
            </div>
          </div>
          
          {/* Overlay UI */}
          <div className="absolute top-4 left-4 bg-black/70 rounded-lg p-3">
            <div className="text-white text-sm font-medium">
              💫 Interactive gifts experience
            </div>
          </div>

          <div className="absolute bottom-4 right-4 bg-black/70 rounded-lg p-3">
            <div className="text-white text-xs">
              <div>🎁 10,000+ gifts sent daily</div>
              <div>💖 Enhanced fan engagement</div>
            </div>
          </div>
        </div>

        {/* Gift Types Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          <div className="text-center p-4 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors">
            <Gift className="h-8 w-8 mx-auto mb-2 text-hyperchat-purple" />
            <div className="text-sm font-medium">Gift Boxes</div>
            <div className="text-xs text-muted-foreground">₹10 - ₹500</div>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors">
            <Heart className="h-8 w-8 mx-auto mb-2 text-hyperchat-pink" />
            <div className="text-sm font-medium">Hearts</div>
            <div className="text-xs text-muted-foreground">Show Love</div>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors">
            <Star className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
            <div className="text-sm font-medium">Stars</div>
            <div className="text-xs text-muted-foreground">Appreciation</div>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors">
            <Award className="h-8 w-8 mx-auto mb-2 text-orange-400" />
            <div className="text-sm font-medium">Trophies</div>
            <div className="text-xs text-muted-foreground">Achievements</div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center justify-center p-1 mb-6 rounded-full bg-secondary/80 text-muted-foreground">
            <span className="text-sm px-4 py-1">Interactive 3D Virtual Gifts - Start at ₹10</span>
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

export default VirtualGiftsShowcase;
