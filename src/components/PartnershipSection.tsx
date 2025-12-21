import React from "react";
import partnershipImage from "@/assets/vritra-hyperchat-partnership.png";
const PartnershipSection = () => {
  return <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
      
      <div className="container px-4 md:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            Official Partnership
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Partnered with{" "}
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              Vritra Esports
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Powering their streamers with Better Engagement Tools
          </p>
        </div>

        {/* Partnership Image */}
        <div className="flex justify-center mb-8">
          <div className="relative group">
            {/* Glow effect behind image */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
            
            <img alt="Vritra Esports x HyperChat Partnership" className="relative w-full max-w-lg md:max-w-xl lg:max-w-2xl rounded-xl shadow-2xl shadow-primary/10 border border-border/50" src="/lovable-uploads/f58b22f3-9b00-4c05-b212-3d4e82299080.png" />
          </div>
        </div>

        {/* Hashtags */}
        <div className="flex justify-center gap-4 flex-wrap">
          <span className="px-4 py-2 rounded-full bg-secondary/50 border border-border/50 text-sm font-medium bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            #EsportsElevated
          </span>
          <span className="px-4 py-2 rounded-full bg-secondary/50 border border-border/50 text-sm font-medium bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            #CreatorsIndia
          </span>
        </div>
      </div>
    </section>;
};
export default PartnershipSection;