
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import CanyonAnimatedText from "@/components/CanyonAnimatedText";
import { useIsMobile } from "@/hooks/use-mobile";

const HeroWithCanyonAnimation = () => {
  const isMobile = useIsMobile();
  
  return (
    <section id="hero" className="py-12 md:py-24 lg:py-32 relative overflow-hidden">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-8 md:space-y-10">
          <div className="space-y-6 md:space-y-8 max-w-3xl">
            <CanyonAnimatedText
              text={isMobile ? "Hype Your Streamer!" : "Hype Your Favourite Streamer!"}
              className="mb-2 md:mb-4"
            />
            
            <h2 className="text-md md:text-xl text-muted-foreground max-w-[40ch] mx-auto px-2">
              The ultimate fan-to-streamer engagement tool that lets you stand out during live streams.
            </h2>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 px-2">
              <Button size={isMobile ? "default" : "lg"} className="bg-gradient-to-r from-hyperchat-purple to-hyperchat-pink hover:opacity-90 rounded-full font-medium">
                Join Beta 
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
              <Button size={isMobile ? "default" : "lg"} variant="outline" className="border-white/20 hover:bg-white/10 rounded-full font-medium">
                View Demo
              </Button>
            </div>
          </div>
          
          <div className="relative w-full max-w-5xl mx-auto">
            {/* Chat message demo animation */}
            <div className="flex justify-center">
              <div className="chat-gradient-border w-full max-w-md px-2">
                <div className="bg-black/70 p-4 md:p-6 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-bold text-lg md:text-xl text-hyperchat-pink">SuperFan123</div>
                    <div className="text-sm md:text-md text-white opacity-90">· ₹500</div>
                  </div>
                  <div className="text-md md:text-lg mt-2 font-medium">
                    Great stream today! Love your content! Can you play my favorite song next?
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroWithCanyonAnimation;
