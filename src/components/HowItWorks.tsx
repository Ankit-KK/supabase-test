
import React from "react";
import { Play, MessageCircle, Sparkles, Heart } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: <Play className="text-white" size={24} />,
      title: "Join a Live Session",
      description: "Connect to a creator's live broadcast on their platform",
      gradient: "bg-gradient-to-br from-hyperchat-purple to-hyperchat-blue",
    },
    {
      icon: <MessageCircle className="text-white" size={24} />,
      title: "Engage with HyperChat",
      description: "Use HyperChat to participate and elevate your presence",
      gradient: "bg-gradient-to-br from-hyperchat-pink to-hyperchat-purple",
    },
    {
      icon: <Sparkles className="text-white" size={24} />,
      title: "Your Presence is Elevated",
      description: "Experience real-time recognition in the live environment",
      gradient: "bg-gradient-to-br from-hyperchat-orange to-hyperchat-pink",
    },
    {
      icon: <Heart className="text-white" size={24} />,
      title: "Create Memorable Moments",
      description: "Be part of something special with creators and communities you care about",
      gradient: "bg-gradient-to-br from-hyperchat-blue to-hyperchat-purple",
    },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-secondary/10">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
            How HyperChat Works
          </h2>
          <p className="text-muted-foreground md:text-xl max-w-3xl mx-auto">
            A simple way to participate meaningfully in live creator content
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className={`w-16 h-16 rounded-full ${step.gradient} flex items-center justify-center mb-4`}>
                  {step.icon}
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
              </div>
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-secondary/50 p-8 rounded-xl border border-white/10 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Ready to Experience Deeper Engagement?</h3>
            <p className="text-muted-foreground mb-6">
              Join creators and audiences who value authentic connection
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-hyperchat-pink rounded-full"></div>
                <span>Real-Time Engagement</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-hyperchat-purple rounded-full"></div>
                <span>Community Building</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-hyperchat-pink rounded-full"></div>
                <span>Authentic Connection</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
