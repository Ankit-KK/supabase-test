import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Users, Zap, Shield, Mic, Gift } from "lucide-react";

const FeatureShowcaseHero = () => {
  const [engagementCount, setEngagementCount] = useState(1247);
  const [liveUsers, setLiveUsers] = useState(23);

  useEffect(() => {
    // Simulate live statistics
    const interval = setInterval(() => {
      setEngagementCount(prev => prev + Math.floor(Math.random() * 3));
      setLiveUsers(prev => Math.max(15, prev + Math.floor(Math.random() * 5) - 2));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: Mic, label: "Audio Messages", desc: "Express Yourself" },
    { icon: Gift, label: "Visual Effects", desc: "Creative Expression" },
    { icon: Zap, label: "Animated Effects", desc: "Stand Out" },
    { icon: Shield, label: "Safe Platform", desc: "Protected Space" }
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-background via-background/95 to-secondary/20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <div className="flex justify-center gap-2 mb-6">
            <Badge variant="secondary" className="bg-hero-gradient text-white">
              <Zap className="w-3 h-3 mr-1" />
              Digital Engagement Platform
            </Badge>
            <Badge variant="outline" className="border-hyperchat-purple text-hyperchat-purple">
              Live: {liveUsers} creators
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-hyperchat-purple to-hyperchat-pink bg-clip-text text-transparent">
            Platform Features
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Explore how HyperChat fosters meaningful connections between creators and audiences. 
            From audio messages to real-time presence - see every engagement feature in action.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="p-4 hover:scale-105 transition-transform bg-card/50 backdrop-blur">
                  <CardContent className="p-0 text-center">
                    <Icon className="w-8 h-8 mx-auto mb-2 text-hyperchat-purple" />
                    <div className="font-semibold text-sm">{feature.label}</div>
                    <div className="text-xs text-hyperchat-pink">{feature.desc}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 bg-gradient-to-br from-hyperchat-purple/10 to-hyperchat-pink/10">
              <CardContent className="p-0 text-center">
                <div className="text-3xl font-bold text-hyperchat-purple mb-2">
                  {engagementCount.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Live Interactions</div>
              </CardContent>
            </Card>
            
            <Card className="p-6 bg-gradient-to-br from-hyperchat-blue/10 to-hyperchat-purple/10">
              <CardContent className="p-0 text-center">
                <div className="text-3xl font-bold text-hyperchat-blue mb-2">99.9%</div>
                <div className="text-sm text-muted-foreground">Platform Uptime</div>
              </CardContent>
            </Card>
            
            <Card className="p-6 bg-gradient-to-br from-hyperchat-pink/10 to-hyperchat-orange/10">
              <CardContent className="p-0 text-center">
                <div className="text-3xl font-bold text-hyperchat-pink mb-2">50+</div>
                <div className="text-sm text-muted-foreground">Engagement Features</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-hero-gradient hover:opacity-90 transition-opacity"
            >
              <Play className="w-4 h-4 mr-2" />
              Explore Platform
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-hyperchat-purple text-hyperchat-purple hover:bg-hyperchat-purple/10"
            >
              <Users className="w-4 h-4 mr-2" />
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureShowcaseHero;