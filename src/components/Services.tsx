
import React from "react";
import { Button } from "@/components/ui/button";
import { Check, CreditCard, BarChart, MessageCircle, LayoutDashboard, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const Services: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    // Create sample donation data for services
    const donationData = {
      name: "New User",
      amount: 300, // Starting price mentioned in the services section
      message: "Getting started with Hyperchat services",
      orderId: `service_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      donationType: "ankit", // Default donation type
    };
    
    // Store in session storage for the checkout page
    sessionStorage.setItem("donationData", JSON.stringify(donationData));
    
    // Navigate to checkout
    navigate("/payment-checkout");
  };

  return (
    <section id="services" className="py-16 md:py-24 bg-secondary/20">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Our Services
          </h2>
          <p className="mt-4 text-muted-foreground md:text-xl">
            Start engaging with your audience at just ₹300 and unlock powerful interactive features
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="flex flex-col p-6 space-y-4 rounded-xl border border-white/10 bg-secondary/50 hover:bg-secondary/80 transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-hyperchat-purple to-hyperchat-pink p-2 rounded-lg">
                <CreditCard className="text-white h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold">Custom Payment Pages</h3>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Check size={18} className="shrink-0 mt-1 text-hyperchat-pink" />
                <span className="text-muted-foreground">Personalized payment pages</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={18} className="shrink-0 mt-1 text-hyperchat-pink" />
                <span className="text-muted-foreground">Customized branding and theming</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={18} className="shrink-0 mt-1 text-hyperchat-pink" />
                <span className="text-muted-foreground">Easy UPI integration for Indian streamers</span>
              </li>
            </ul>
          </div>
          
          <div className="flex flex-col p-6 space-y-4 rounded-xl border border-white/10 bg-secondary/50 hover:bg-secondary/80 transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-hyperchat-purple to-hyperchat-pink p-2 rounded-lg">
                <LayoutDashboard className="text-white h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold">Comprehensive Dashboard</h3>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Check size={18} className="shrink-0 mt-1 text-hyperchat-pink" />
                <span className="text-muted-foreground">Real-time donation tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={18} className="shrink-0 mt-1 text-hyperchat-pink" />
                <span className="text-muted-foreground">Audience analytics and engagement metrics</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={18} className="shrink-0 mt-1 text-hyperchat-pink" />
                <span className="text-muted-foreground">Customizable settings and preferences</span>
              </li>
            </ul>
          </div>
          
          <div className="flex flex-col p-6 space-y-4 rounded-xl border border-white/10 bg-secondary/50 hover:bg-secondary/80 transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-hyperchat-purple to-hyperchat-pink p-2 rounded-lg">
                <MessageCircle className="text-white h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold">Live Chat Integrations</h3>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Check size={18} className="shrink-0 mt-1 text-hyperchat-pink" />
                <span className="text-muted-foreground">Live chat previews on your stream</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={18} className="shrink-0 mt-1 text-hyperchat-pink" />
                <span className="text-muted-foreground">Interactive message animations</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={18} className="shrink-0 mt-1 text-hyperchat-pink" />
                <span className="text-muted-foreground">Highlighted fan messages with custom effects</span>
              </li>
            </ul>
          </div>
          
          <div className="flex flex-col p-6 space-y-4 rounded-xl border border-white/10 bg-secondary/50 hover:bg-secondary/80 transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-hyperchat-purple to-hyperchat-pink p-2 rounded-lg">
                <Settings className="text-white h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold">Custom Interactions</h3>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Check size={18} className="shrink-0 mt-1 text-hyperchat-pink" />
                <span className="text-muted-foreground">Personalized viewer interactions</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={18} className="shrink-0 mt-1 text-hyperchat-pink" />
                <span className="text-muted-foreground">Custom animation effects and overlays</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={18} className="shrink-0 mt-1 text-hyperchat-pink" />
                <span className="text-muted-foreground">Unique viewer reward systems</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <div className="inline-flex items-center justify-center p-1 mb-8 rounded-full bg-secondary/80 text-muted-foreground">
            <span className="text-sm px-4 py-1">Starting at just ₹300</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-hero-gradient hover:opacity-90 transition-opacity"
              onClick={handleGetStarted}
            >
              Get Started Now
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
