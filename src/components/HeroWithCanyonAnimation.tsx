import React, { useState } from "react";
import CanyonAnimatedText from "@/components/CanyonAnimatedText";
import { Button } from "@/components/ui/button";
import SignupDialog from "@/components/SignupDialog";
const HeroWithCanyonAnimation = () => {
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  return <section id="hero" className="py-20 md:py-24 lg:py-32 relative overflow-hidden">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-10">
          <div className="space-y-8 max-w-4xl">
            <div className="mb-4">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 via-white to-green-500 text-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm mb-4">
                Made in India, for Creators
              </div>
            </div>
            
            <CanyonAnimatedText text="Connecting Audiences and Creators" className="mb-4 text-center" />
            
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-muted-foreground max-w-[90%] sm:max-w-[60ch] mx-auto">
              A platform built to foster meaningful audience–creator connection, expression, and presence.
            </h2>
            
            <div className="mt-8">
              <Button size="lg" className="bg-hero-gradient hover:opacity-90 transition-opacity text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8 text-white" onClick={() => setShowSignupDialog(true)}>
                Get Connected
              </Button>
            </div>
          </div>
        </div>
      </div>

      <SignupDialog open={showSignupDialog} onOpenChange={setShowSignupDialog} />
    </section>;
};
export default HeroWithCanyonAnimation;