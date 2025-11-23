
import React from "react";
import { Sparkles } from "lucide-react";
import CanyonAnimatedText from "@/components/CanyonAnimatedText";
import { Button } from "@/components/ui/button";

const HeroWithCanyonAnimation = () => {

  return (
    <section id="hero" className="py-20 md:py-24 lg:py-32 relative overflow-hidden">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-10">
          <div className="space-y-8 max-w-4xl">
            <div className="mb-4">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 via-white to-green-500 text-black px-4 py-2 rounded-full font-bold text-sm mb-4">
                Made in India, for Indian Creators
              </div>
            </div>
            
            <CanyonAnimatedText
              text="Connecting Audiences and Creators — Instantly."
              className="mb-4"
            />
            
            <h2 className="text-2xl md:text-3xl font-bold text-muted-foreground max-w-[60ch] mx-auto">
              A platform built to foster real-time engagement, expression, and presence during live content.
            </h2>
            
            <div className="mt-8">
              <Button size="lg" className="bg-hero-gradient hover:opacity-90 transition-opacity text-lg px-8">
                Join the Experience
              </Button>
            </div>
          </div>
          
          <div className="relative w-full max-w-5xl mx-auto mt-12">
            <div className="flex justify-center">
              <div className="chat-gradient-border w-full max-w-md">
                <div className="bg-black/70 p-6 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-bold text-xl text-hyperchat-pink">ActiveViewer</div>
                    <Sparkles className="h-5 w-5 text-hyperchat-purple" />
                  </div>
                  <div className="text-white text-lg mt-2 font-medium">
                    "Your presence was felt in that moment! 🌟"
                  </div>
                  <div className="text-xs text-white/70 mt-2">
                    Enhanced Presence
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
