import React from "react";
import { Gift, ShoppingBag, Star, Zap, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const HyperstoreShowcase: React.FC = () => {
  const categories = [
    {
      icon: <ShoppingBag className="text-white" size={24} />,
      title: "Streaming Gear",
      description: "Top-rated microphones, webcams, and capture cards used by pro streamers",
      gradient: "bg-gradient-to-br from-hyperchat-purple to-hyperchat-blue",
    },
    {
      icon: <Star className="text-white" size={24} />,
      title: "Gaming Peripherals",
      description: "High-performance mice, keyboards, and mousepads for competitive gaming",
      gradient: "bg-gradient-to-br from-hyperchat-pink to-hyperchat-purple",
    },
    {
      icon: <Zap className="text-white" size={24} />,
      title: "Monitors & Displays",
      description: "Gaming monitors and displays handpicked for the best streaming experience",
      gradient: "bg-gradient-to-br from-hyperchat-orange to-hyperchat-pink",
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Discover the{" "}
            <span className="bg-gradient-to-r from-hyperchat-purple via-hyperchat-pink to-hyperchat-orange bg-clip-text text-transparent">
              Hyperstore
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground md:text-xl max-w-3xl mx-auto">
            Exclusive creator merch, collectibles, and rewards — all in one place
          </p>
        </div>

        {/* Product Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
          {categories.map((cat, index) => (
            <div
              key={index}
              className="flex flex-col p-6 space-y-4 rounded-xl border border-white/10 bg-secondary/50 hover:bg-secondary/80 transition-colors"
            >
              <div className={`w-12 h-12 rounded-lg ${cat.gradient} flex items-center justify-center`}>
                {cat.icon}
              </div>
              <h3 className="text-xl font-bold">{cat.title}</h3>
              <p className="text-muted-foreground">{cat.description}</p>
            </div>
          ))}
        </div>

        {/* Rewards Highlight Strip */}
        <div className="max-w-3xl mx-auto mb-10 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
            <Gift className="text-yellow-400" size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-400">
              Earn Hyperpoints with every donation ₹1000+ → Redeem at the Hyperstore
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Every ₹1000 donated = 50 Hyperpoints. Stack them up and unlock exclusive rewards!
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <a href="https://hyperchat.store/" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-gradient-to-r from-hyperchat-purple to-hyperchat-pink hover:opacity-90 text-white gap-2">
              Visit Hyperstore <ExternalLink size={16} />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default HyperstoreShowcase;
