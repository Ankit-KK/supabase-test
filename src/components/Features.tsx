
import React from "react";
import { MessageSquare, Palette, Users, Award, Heart, Star, CreditCard, Zap, Sparkles } from "lucide-react";

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}

const Feature: React.FC<FeatureProps> = ({ icon, title, description, gradient }) => {
  return (
    <div className="flex flex-col p-6 space-y-4 rounded-xl border border-white/10 bg-secondary/50 hover:bg-secondary/80 transition-colors">
      <div className={`w-12 h-12 rounded-lg ${gradient} flex items-center justify-center`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

const Features: React.FC = () => {
  const features = [
    {
      icon: <CreditCard className="text-white" size={24} />,
      title: "UPI & Card Payments for Creators",
      description: "Enable direct fan support via UPI, Rupay, and Master cards with instant payment processing. Visa cards coming soon! Perfect payment platform for creators in India.",
      gradient: "bg-gradient-to-br from-hyperchat-purple to-hyperchat-blue",
    },
    {
      icon: <Heart className="text-white" size={24} />,
      title: "Virtual Gifts for Live Streamers",
      description: "Let fans tip your favorite content creators with virtual gifting and animated effects during live streams.",
      gradient: "bg-gradient-to-br from-hyperchat-pink to-hyperchat-purple",
    },
    {
      icon: <MessageSquare className="text-white" size={24} />,
      title: "Live Chat Tipping",
      description: "Interactive live chat tipping system that highlights premium messages and creates better fan engagement.",
      gradient: "bg-gradient-to-br from-hyperchat-orange to-hyperchat-pink",
    },
    {
      icon: <Zap className="text-white" size={24} />,
      title: "Get Paid by Fans Instantly",
      description: "Earn money from streaming in India with instant UPI, Rupay & Master card transfers. Visa support coming soon! No delays, no hassle - just direct monetization.",
      gradient: "bg-gradient-to-br from-hyperchat-pink to-hyperchat-orange",
    },
    {
      icon: <Award className="text-white" size={24} />,
      title: "Content Monetization Tools",
      description: "Complete platform to monetize content in India with analytics, fan leaderboards, and recognition systems.",
      gradient: "bg-gradient-to-br from-hyperchat-blue to-hyperchat-purple",
    },
    {
      icon: <Users className="text-white" size={24} />,
      title: "Indian Streaming Monetization",
      description: "Built specifically for Indian creators with UPI, Rupay, Master card integration, and all major local payment methods. Visa cards coming soon!",
      gradient: "bg-gradient-to-br from-hyperchat-purple to-hyperchat-pink",
    },
    {
      icon: <Sparkles className="text-white" size={24} />,
      title: "HyperEmotes Emoji Rain",
      description: "Premium donations trigger spectacular emoji rain effects with up to 50 animated emojis cascading across the screen.",
      gradient: "bg-gradient-to-br from-hyperchat-pink to-hyperchat-orange",
    },
  ];

  return (
    <section id="features" className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Complete Live Streaming Platform for Content Monetization
          </h2>
          <p className="mt-4 text-muted-foreground md:text-xl">
            Everything you need for fan engagement with UPI, Rupay, Master cards, and comprehensive payment solutions in India. Visa support coming soon!
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Feature
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              gradient={feature.gradient}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
