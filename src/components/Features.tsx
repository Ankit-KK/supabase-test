
import React from "react";
import { MessageSquare, Users, Heart, Zap, Sparkles, Award } from "lucide-react";

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
      title: "Real-Time Engagement",
      description: "Enable meaningful interactions between you and your audience during live moments",
      gradient: "bg-gradient-to-br from-hyperchat-purple to-hyperchat-blue",
    },
    {
      icon: <Users className="text-white" size={24} />,
      title: "Elevated Presence",
      description: "Make your audience feel noticed, valued, and part of the experience",
      gradient: "bg-gradient-to-br from-hyperchat-pink to-hyperchat-purple",
    },
    {
      icon: <Sparkles className="text-white" size={24} />,
      title: "Expressive Communication",
      description: "Go beyond basic chat — create memorable and personalized moments",
      gradient: "bg-gradient-to-br from-hyperchat-orange to-hyperchat-pink",
    },
    {
      icon: <Heart className="text-white" size={24} />,
      title: "Community Identity",
      description: "Build stronger connections with audiences who truly engage with your content",
      gradient: "bg-gradient-to-br from-hyperchat-pink to-hyperchat-orange",
    },
    {
      icon: <Zap className="text-white" size={24} />,
      title: "Live Participation",
      description: "Transform passive viewers into active participants in your creative journey",
      gradient: "bg-gradient-to-br from-hyperchat-blue to-hyperchat-purple",
    },
    {
      icon: <Award className="text-white" size={24} />,
      title: "Audience Recognition",
      description: "Help your supporters stand out and be recognized in the moment",
      gradient: "bg-gradient-to-br from-hyperchat-purple to-hyperchat-pink",
    },
  ];

  return (
    <section id="features" className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Deepen Creator-Audience Relationships
          </h2>
          <p className="mt-4 text-muted-foreground md:text-xl">
            Everything you need to foster meaningful engagement and build authentic community connections
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
