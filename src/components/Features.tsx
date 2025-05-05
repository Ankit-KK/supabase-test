
import React from "react";
import { MessageSquare, Palette, Users, Award, Heart, Star } from "lucide-react";

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
      icon: <MessageSquare className="text-white" size={24} />,
      title: "Premium Messages",
      description: "Send vibrant, pinned chats that get noticed above the regular chat flow.",
      gradient: "bg-gradient-to-br from-hyperchat-purple to-hyperchat-blue",
    },
    {
      icon: <Palette className="text-white" size={24} />,
      title: "Custom Styles",
      description: "Add flair with emojis, colors, animations, and effects to make your messages unique.",
      gradient: "bg-gradient-to-br from-hyperchat-pink to-hyperchat-purple",
    },
    {
      icon: <Star className="text-white" size={24} />,
      title: "Real-Time Reactions",
      description: "Watch your message light up the stream in real-time with interactive elements.",
      gradient: "bg-gradient-to-br from-hyperchat-orange to-hyperchat-pink",
    },
    {
      icon: <Heart className="text-white" size={24} />,
      title: "Support Creators",
      description: "Turn your hype into direct support for your favorite streamers.",
      gradient: "bg-gradient-to-br from-hyperchat-pink to-hyperchat-orange",
    },
    {
      icon: <Award className="text-white" size={24} />,
      title: "Fan Leaderboards",
      description: "Get recognized for your support and climb the ranks of your favorite channels.",
      gradient: "bg-gradient-to-br from-hyperchat-blue to-hyperchat-purple",
    },
    {
      icon: <Users className="text-white" size={24} />,
      title: "Community Recognition",
      description: "Build your reputation across multiple channels with badges and special perks.",
      gradient: "bg-gradient-to-br from-hyperchat-purple to-hyperchat-pink",
    },
  ];

  return (
    <section id="features" className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Supercharge Your Stream Interactions
          </h2>
          <p className="mt-4 text-muted-foreground md:text-xl">
            All the tools you need to make meaningful connections during live streams.
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
