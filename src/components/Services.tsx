
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, CreditCard, BarChart, MessageCircle, LayoutDashboard, Settings, IndianRupee } from "lucide-react";
import { Link } from "react-router-dom";
import SignupDialog from "@/components/SignupDialog";

const Services: React.FC = () => {
  const [showSignupDialog, setShowSignupDialog] = useState(false);

  const handleGetStarted = () => {
    setShowSignupDialog(true);
  };

  return (
    <section id="services" className="py-16 md:py-24 bg-secondary/20">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Streamer Donation App & Live Stream Payment Gateway
          </h2>
          <p className="mt-4 text-muted-foreground md:text-xl">
            Start earning with our UPI & Card payment platform (Rupay, Master cards) at just ₹300. Visa support coming soon! Support streamers with multiple payment methods and monetize your content in India.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="flex flex-col p-6 space-y-4 rounded-xl border border-white/10 bg-secondary/50 hover:bg-secondary/80 transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-hyperchat-purple to-hyperchat-pink p-2 rounded-lg">
                <IndianRupee className="text-white h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold">UPI & Card Payment Integration</h3>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Check size={18} className="shrink-0 mt-1 text-hyperchat-pink" />
                <span className="text-muted-foreground">Direct fan support via UPI, Rupay & Master cards</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={18} className="shrink-0 mt-1 text-hyperchat-pink" />
                <span className="text-muted-foreground">Multiple payment methods with Visa coming soon</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={18} className="shrink-0 mt-1 text-hyperchat-pink" />
                <span className="text-muted-foreground">Get paid by fans instantly with zero delays</span>
              </li>
            </ul>
          </div>
          
          <div className="flex flex-col p-6 space-y-4 rounded-xl border border-white/10 bg-secondary/50 hover:bg-secondary/80 transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-hyperchat-purple to-hyperchat-pink p-2 rounded-lg">
                <LayoutDashboard className="text-white h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold">Creator Monetization Dashboard</h3>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Check size={18} className="shrink-0 mt-1 text-hyperchat-pink" />
                <span className="text-muted-foreground">Track creators earning with UPI & cards in real-time</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={18} className="shrink-0 mt-1 text-hyperchat-pink" />
                <span className="text-muted-foreground">Analytics for Indian streaming monetization</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={18} className="shrink-0 mt-1 text-hyperchat-pink" />
                <span className="text-muted-foreground">Fan engagement metrics and insights</span>
              </li>
            </ul>
          </div>
          
          <div className="flex flex-col p-6 space-y-4 rounded-xl border border-white/10 bg-secondary/50 hover:bg-secondary/80 transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-hyperchat-purple to-hyperchat-pink p-2 rounded-lg">
                <MessageCircle className="text-white h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold">Live Chat Tipping & Voice Messages</h3>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Check size={18} className="shrink-0 mt-1 text-hyperchat-pink" />
                <span className="text-muted-foreground">Voice messages with donations for authentic fan interaction</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={18} className="shrink-0 mt-1 text-hyperchat-pink" />
                <span className="text-muted-foreground">Interactive live chat tipping system</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={18} className="shrink-0 mt-1 text-hyperchat-pink" />
                <span className="text-muted-foreground">Help fans tip your favorite content creators easily</span>
              </li>
            </ul>
          </div>
          
          <div className="flex flex-col p-6 space-y-4 rounded-xl border border-white/10 bg-secondary/50 hover:bg-secondary/80 transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-hyperchat-purple to-hyperchat-pink p-2 rounded-lg">
                <Settings className="text-white h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold">Content Monetization Tools</h3>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Check size={18} className="shrink-0 mt-1 text-hyperchat-pink" />
                <span className="text-muted-foreground">Complete platform to monetize content in India</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={18} className="shrink-0 mt-1 text-hyperchat-pink" />
                <span className="text-muted-foreground">Earn money from streaming with multiple revenue streams</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={18} className="shrink-0 mt-1 text-hyperchat-pink" />
                <span className="text-muted-foreground">Advanced fan engagement and loyalty programs</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <div className="inline-flex items-center justify-center p-1 mb-8 rounded-full bg-secondary/80 text-muted-foreground">
            <span className="text-sm px-4 py-1">UPI & Card Payment Platform for Creators - Starting at just ₹300</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-hero-gradient hover:opacity-90 transition-opacity"
              onClick={handleGetStarted}
            >
              Start Monetizing Content Now
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/contact">Learn About Payment Integration</Link>
            </Button>
          </div>
        </div>
      </div>
      
      <SignupDialog open={showSignupDialog} onOpenChange={setShowSignupDialog} />
    </section>
  );
};

export default Services;
