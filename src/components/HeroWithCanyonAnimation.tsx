
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, Mic, Gif, IndianRupee } from "lucide-react";
import CanyonAnimatedText from "@/components/CanyonAnimatedText";
import SignupDialog from "@/components/SignupDialog";

const HeroWithCanyonAnimation = () => {
  const [showSignupDialog, setShowSignupDialog] = useState(false);

  return (
    <section id="hero" className="py-20 md:py-24 lg:py-32 relative overflow-hidden">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-10">
          <div className="space-y-8 max-w-4xl">
            <div className="mb-4">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 via-white to-green-500 text-black px-4 py-2 rounded-full font-bold text-sm mb-4">
                🇮🇳 Made in India, for Indian Streamers
              </div>
            </div>
            
            <CanyonAnimatedText
              text="India's Own Streaming Innovation"
              className="mb-4"
            />
            
            <h2 className="text-2xl md:text-3xl font-bold text-muted-foreground max-w-[60ch] mx-auto">
              Not just donations — real conversations.
            </h2>
            
            <div className="text-lg md:text-xl font-semibold text-hyperchat-pink max-w-[70ch] mx-auto">
              Not competing. Not copying. We're creating. We're innovating.
            </div>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-[50ch] mx-auto">
              The world's first platform where fans send voice messages and custom GIFs with UPI donations. Built for Indian creators, powered by Indian innovation.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-hyperchat-purple to-hyperchat-pink hover:opacity-90 rounded-full font-medium"
                onClick={() => setShowSignupDialog(true)}
              >
                Get Started Now
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-hyperchat-purple text-hyperchat-purple hover:bg-hyperchat-purple hover:text-white rounded-full font-medium"
                onClick={() => setShowSignupDialog(true)}
              >
                Upgrade with Voice & GIFs
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-sm">
              <div className="flex flex-col items-center space-y-3 p-4 rounded-lg bg-secondary/20 border border-white/10">
                <div className="flex items-center gap-2">
                  <Mic className="text-hyperchat-pink h-5 w-5" />
                  <div className="text-hyperchat-pink font-semibold">Voice Messages</div>
                </div>
                <div className="text-muted-foreground text-center">Record your voice with donations. Real emotions, real connections.</div>
              </div>
              <div className="flex flex-col items-center space-y-3 p-4 rounded-lg bg-secondary/20 border border-white/10">
                <div className="flex items-center gap-2">
                  <Gif className="text-hyperchat-purple h-5 w-5" />
                  <div className="text-hyperchat-purple font-semibold">Custom GIFs</div>
                </div>
                <div className="text-muted-foreground text-center">Upload your own GIFs for personalized donation alerts</div>
              </div>
              <div className="flex flex-col items-center space-y-3 p-4 rounded-lg bg-secondary/20 border border-white/10">
                <div className="flex items-center gap-2">
                  <IndianRupee className="text-hyperchat-pink h-5 w-5" />
                  <div className="text-hyperchat-pink font-semibold">UPI Powered</div>
                </div>
                <div className="text-muted-foreground text-center">Fast, secure, made for Indian creators</div>
              </div>
            </div>
          </div>
          
          <div className="relative w-full max-w-5xl mx-auto">
            <div className="flex justify-center">
              <div className="chat-gradient-border w-full max-w-md">
                <div className="bg-black/70 p-6 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-bold text-xl text-hyperchat-pink">SuperFan123</div>
                    <div className="text-md text-white opacity-90">· ₹500</div>
                    <Mic className="h-4 w-4 text-hyperchat-purple" />
                  </div>
                  <div className="text-white text-lg mt-2 font-medium">
                    🎤 "Bhai, your gameplay is insane! Keep it up!" + Custom GIF 🔥
                  </div>
                  <div className="text-xs text-white/70 mt-2">
                    Voice message + GIF • Powered by UPI
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
