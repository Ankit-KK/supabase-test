
import React from "react";
import { UserPlus, CreditCard, TrendingUp, Users } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: <UserPlus className="text-white" size={24} />,
      title: "Sign Up as Creator",
      description: "Join our UPI payment platform for creators and set up your personalized donation page to start earning money from streaming in India.",
      gradient: "bg-gradient-to-br from-hyperchat-purple to-hyperchat-blue",
    },
    {
      icon: <CreditCard className="text-white" size={24} />,
      title: "Enable UPI Payments",
      description: "Connect your UPI ID and enable direct fan support via UPI. Our UPI-based tipping solution makes it easy for fans to support you.",
      gradient: "bg-gradient-to-br from-hyperchat-pink to-hyperchat-purple",
    },
    {
      icon: <Users className="text-white" size={24} />,
      title: "Engage Your Fans",
      description: "Let fans tip your favorite content creators with virtual gifts, live chat tipping, and interactive fan engagement tools.",
      gradient: "bg-gradient-to-br from-hyperchat-orange to-hyperchat-pink",
    },
    {
      icon: <TrendingUp className="text-white" size={24} />,
      title: "Get Paid Instantly",
      description: "Receive instant payments and monetize content in India. Track your creators earning with UPI through our comprehensive dashboard.",
      gradient: "bg-gradient-to-br from-hyperchat-blue to-hyperchat-purple",
    },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-secondary/10">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
            How to Earn Money from Streaming in India
          </h2>
          <p className="text-muted-foreground md:text-xl max-w-3xl mx-auto">
            Simple 4-step process to start monetizing your content and receiving support from fans through our live streaming platform.
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
            <h3 className="text-2xl font-bold mb-4">Ready to Start Your Content Monetization Journey?</h3>
            <p className="text-muted-foreground mb-6">
              Join thousands of creators already using our UPI for content creators platform to earn money from streaming and receive virtual gifts for live streamers.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-hyperchat-pink rounded-full"></div>
                <span>Indian Streaming Monetization</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-hyperchat-purple rounded-full"></div>
                <span>Live Stream Payment Gateway</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-hyperchat-pink rounded-full"></div>
                <span>Streamer Donation App</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
