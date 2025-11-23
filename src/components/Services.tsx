
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, Heart, MessageCircle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import SignupDialog from "@/components/SignupDialog";

const Services: React.FC = () => {
  const [showSignupDialog, setShowSignupDialog] = useState(false);

  return (
    <section id="services" className="py-16 md:py-24 bg-secondary/20">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Why Creators Choose HyperChat
          </h2>
          <p className="mt-4 text-muted-foreground md:text-xl">
            Build deeper connections and transform how your audience participates in live moments
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="flex flex-col p-6 space-y-4 rounded-xl border border-white/10 bg-secondary/50 hover:bg-secondary/80 transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-hyperchat-purple to-hyperchat-pink p-2 rounded-lg">
                <Users className="text-white h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold">Meaningful Participation</h3>
            </div>
            <p className="text-muted-foreground">
              Your audience doesn't just watch — they actively participate and shape the experience
            </p>
          </div>
          
          <div className="flex flex-col p-6 space-y-4 rounded-xl border border-white/10 bg-secondary/50 hover:bg-secondary/80 transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-hyperchat-purple to-hyperchat-pink p-2 rounded-lg">
                <Heart className="text-white h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold">Stronger Community</h3>
            </div>
            <p className="text-muted-foreground">
              Build deeper relationships with engaged audiences who feel truly connected to your content
            </p>
          </div>
          
          <div className="flex flex-col p-6 space-y-4 rounded-xl border border-white/10 bg-secondary/50 hover:bg-secondary/80 transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-hyperchat-purple to-hyperchat-pink p-2 rounded-lg">
                <MessageCircle className="text-white h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold">Enhanced Communication</h3>
            </div>
            <p className="text-muted-foreground">
              Real-time interaction tools that make your live sessions more dynamic and responsive
            </p>
          </div>
          
          <div className="flex flex-col p-6 space-y-4 rounded-xl border border-white/10 bg-secondary/50 hover:bg-secondary/80 transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-hyperchat-purple to-hyperchat-pink p-2 rounded-lg">
                <Sparkles className="text-white h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold">Audience Personality</h3>
            </div>
            <p className="text-muted-foreground">
              Let your community express themselves and create memorable moments together
            </p>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-hero-gradient hover:opacity-90 transition-opacity"
              onClick={() => setShowSignupDialog(true)}
            >
              Join the Experience
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/contact">Learn About Our Platform</Link>
            </Button>
          </div>
        </div>
      </div>
      
      <SignupDialog open={showSignupDialog} onOpenChange={setShowSignupDialog} />
    </section>
  );
};

export default Services;
