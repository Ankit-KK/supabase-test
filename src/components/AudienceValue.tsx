import React from "react";
import { Eye, Heart, Sparkles, Award } from "lucide-react";

const AudienceValue: React.FC = () => {
  const benefits = [
    {
      icon: <Eye className="text-white" size={24} />,
      title: "Your Presence is Noticed",
      description: "Stand out in the moment and make your participation meaningful",
      gradient: "bg-gradient-to-br from-hyperchat-purple to-hyperchat-blue",
    },
    {
      icon: <Heart className="text-white" size={24} />,
      title: "Feel Connected",
      description: "Become part of the live experience, not just a viewer",
      gradient: "bg-gradient-to-br from-hyperchat-pink to-hyperchat-purple",
    },
    {
      icon: <Sparkles className="text-white" size={24} />,
      title: "Express Yourself",
      description: "Share your energy and personality with creators you love",
      gradient: "bg-gradient-to-br from-hyperchat-orange to-hyperchat-pink",
    },
    {
      icon: <Award className="text-white" size={24} />,
      title: "Be Recognized",
      description: "Build your identity within the community",
      gradient: "bg-gradient-to-br from-hyperchat-blue to-hyperchat-purple",
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Why Audiences Love HyperChat
          </h2>
          <p className="mt-4 text-muted-foreground md:text-xl max-w-3xl mx-auto">
            Experience meaningful connections and make your presence felt during live moments
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="flex flex-col p-6 space-y-4 rounded-xl border border-white/10 bg-secondary/50 hover:bg-secondary/80 transition-colors"
            >
              <div className={`w-12 h-12 rounded-lg ${benefit.gradient} flex items-center justify-center`}>
                {benefit.icon}
              </div>
              <h3 className="text-xl font-bold">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AudienceValue;
