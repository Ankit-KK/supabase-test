
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import CanyonAnimatedText from "@/components/CanyonAnimatedText";
import SignupDialog from "@/components/SignupDialog";

const HeroWithCanyonAnimation = () => {
  const [showSignupDialog, setShowSignupDialog] = useState(false);

  return (
    <section id="hero" className="py-20 md:py-24 lg:py-32 relative overflow-hidden">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-10">
          <div className="space-y-8 max-w-3xl">
            <CanyonAnimatedText
              text="UPI Payment Platform for Creators!"
              className="mb-4"
            />
            
            <h2 className="text-xl md:text-2xl text-muted-foreground max-w-[50ch] mx-auto">
              The ultimate live streaming platform for content monetization in India. Enable direct fan support via UPI, virtual gifting, and get paid by fans instantly.
            </h2>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-hyperchat-purple to-hyperchat-pink hover:opacity-90 rounded-full font-medium"
                onClick={() => setShowSignupDialog(true)}
              >
                Start Monetizing Content
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-sm">
              <div className="flex flex-col items-center space-y-2">
                <div className="text-hyperchat-pink font-semibold">UPI Payments</div>
                <div className="text-muted-foreground">Instant UPI-based tipping solution</div>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="text-hyperchat-purple font-semibold">Live Chat Tipping</div>
                <div className="text-muted-foreground">Interactive fan engagement tools</div>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="text-hyperchat-pink font-semibold">Earn Instantly</div>
                <div className="text-muted-foreground">Support streamers with UPI payments</div>
              </div>
            </div>
          </div>
          
          <div className="relative w-full max-w-5xl mx-auto">
            {/* Chat message demo animation */}
            <div className="flex justify-center">
              <div className="chat-gradient-border w-full max-w-md">
                <div className="bg-black/70 p-6 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-bold text-xl text-hyperchat-pink">SuperFan123</div>
                    <div className="text-md text-white opacity-90">· ₹500</div>
                  </div>
                  <div className="text-white text-lg mt-2 font-medium">
                    Love supporting my favorite creator! This UPI payment was so easy! 💖
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Render SignupDialog conditionally only when needed */}
      {showSignupDialog && (
        <SignupDialog 
          open={showSignupDialog} 
          onOpenChange={setShowSignupDialog} 
        />
      )}
    </section>
  );
};

export default HeroWithCanyonAnimation;
