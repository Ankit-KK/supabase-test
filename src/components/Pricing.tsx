
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Mic, Gift, IndianRupee, Zap, Crown, Sparkles } from "lucide-react";
import SignupDialog from "@/components/SignupDialog";

interface PricingPlanProps {
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  features: string[];
  popular?: boolean;
  gradient?: string;
  icon: React.ReactNode;
  badge?: string;
  isMonthly?: boolean;
}

const PricingPlan: React.FC<PricingPlanProps> = ({
  name,
  description,
  price,
  originalPrice,
  features,
  popular,
  gradient,
  icon,
  badge,
  isMonthly,
}) => {
  const [showSignupDialog, setShowSignupDialog] = useState(false);

  return (
    <>
      <div className={`rounded-2xl ${popular ? 'relative border-0 p-[1px] transform scale-105' : 'border border-white/10'}`}>
        {popular && (
          <div className={`absolute inset-0 rounded-2xl ${gradient} opacity-70 blur-[2px]`} />
        )}
        <div className={`h-full rounded-2xl p-6 bg-secondary/80 backdrop-blur-sm flex flex-col ${popular ? 'border-0' : ''} relative`}>
          {popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-hero-gradient text-white text-xs font-bold py-2 px-4 rounded-full">
              🔥 BEST VALUE
            </div>
          )}
          {badge && (
            <div className="absolute -top-2 -right-2 bg-hyperchat-orange text-white text-xs font-bold py-1 px-3 rounded-full">
              {badge}
            </div>
          )}
          
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${gradient || 'bg-hyperchat-purple'}`}>
                {icon}
              </div>
              <h3 className={`text-xl font-bold ${popular ? 'text-hyperchat-pink' : ''}`}>{name}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          
          <div className="mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold flex items-center">
                <IndianRupee className="h-6 w-6" />
                {price}
              </span>
              {originalPrice && (
                <span className="text-lg text-muted-foreground line-through flex items-center">
                  <IndianRupee className="h-4 w-4" />
                  {originalPrice}
                </span>
              )}
              <span className="text-muted-foreground text-sm">{isMonthly ? '/month' : 'one-time'}</span>
            </div>
          </div>
          
          <ul className="space-y-3 mb-6 flex-1">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check size={18} className={`shrink-0 mt-0.5 ${popular ? 'text-hyperchat-pink' : 'text-hyperchat-purple'}`} />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
          
          <Button
            className={`w-full transition-all duration-300 ${
              popular
                ? 'bg-gradient-to-r from-gaming-pink-primary to-gaming-pink-accent hover:from-gaming-pink-accent hover:to-gaming-pink-primary transform hover:scale-105 shadow-lg hover:shadow-gaming-pink-primary/50'
                : 'bg-gradient-to-r from-hyperchat-blue to-hyperchat-purple hover:from-hyperchat-purple hover:to-hyperchat-blue transform hover:scale-105 shadow-lg hover:shadow-hyperchat-blue/50'
            }`}
            onClick={() => setShowSignupDialog(true)}
          >
            Get Started Now
          </Button>
        </div>
      </div>
      
      {showSignupDialog && (
        <SignupDialog 
          open={showSignupDialog} 
          onOpenChange={setShowSignupDialog}
        />
      )}
    </>
  );
};

const Pricing: React.FC = () => {
  const plans = [
    {
      name: "Base Plan",
      description: "Essential streaming page with UPI donations",
      price: "399",
      icon: <Zap className="text-white h-5 w-5" />,
      gradient: "bg-gradient-to-br from-hyperchat-blue to-hyperchat-purple",
      features: [
        "Custom streaming page",
        "UPI donation integration",
        "Basic chat highlighting",
        "Donation alerts",
        "Real-time notifications",
        "Mobile responsive design",
      ],
    },
  ];

  const addOns = [
    {
      name: "Voice Message Feature",
      description: "Add voice recording to donations",
      price: "500",
      icon: <Mic className="text-white h-5 w-5" />,
      gradient: "bg-gradient-to-br from-hyperchat-purple to-hyperchat-pink",
      features: [
        "Voice message recordings (15-60s)",
        "Audio alerts on stream",
        "Voice visualization effects",
        "Fan voice gallery",
      ],
    },
    {
      name: "HyperEmotes",
      description: "Epic emoji rain effects for premium donations",
      price: "500",
      icon: <Sparkles className="text-white h-5 w-5" />,
      gradient: "bg-gradient-to-br from-hyperchat-purple to-hyperchat-blue",
      features: [
        "Up to 50 animated emojis",
        "Cascading rain effects",
        "Premium donation tier (₹50+)",
        "Customizable emoji sets",
      ],
    },
    {
      name: "Monthly Hosting",
      description: "Professional hosting & maintenance",
      price: "699",
      icon: <IndianRupee className="text-white h-5 w-5" />,
      gradient: "bg-gradient-to-br from-hyperchat-orange to-hyperchat-pink",
      isMonthly: true,
      features: [
        "99.9% uptime guarantee",
        "Daily backups",
        "Technical support",
      ],
    },
  ];

  const bundleOffer = {
    name: "Complete Bundle",
    description: "Base Plan + Voice + HyperEmotes",
    price: "1199",
    originalPrice: "1399",
    popular: true,
    gradient: "bg-hero-gradient",
    icon: <Crown className="text-white h-5 w-5" />,
    badge: "SAVE ₹200",
    features: [
      "Everything in Base Plan",
      "Voice message recordings",
      "HyperEmotes emoji rain effects",
      "Advanced customization",
      "Priority support",
      "Early access to new features",
    ],
  };

  return (
    <section id="pricing" className="py-16 md:py-24 bg-mesh-gradient">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 via-white to-green-500 text-black px-4 py-2 rounded-full font-bold text-sm mb-4">
            🇮🇳 Made in India Pricing
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Revolutionary Features, Affordable Prices
          </h2>
          <p className="mt-4 text-muted-foreground md:text-xl">
            One-time payments. No monthly subscriptions. Built for Indian creators.
          </p>
        </div>

        {/* Base Plan */}
        <div className="max-w-md mx-auto mb-12">
          <PricingPlan
            name={plans[0].name}
            description={plans[0].description}
            price={plans[0].price}
            features={plans[0].features}
            gradient={plans[0].gradient}
            icon={plans[0].icon}
          />
        </div>

        {/* Add-Ons Section */}
        <div className="max-w-6xl mx-auto mb-12">
          <h3 className="text-2xl font-bold text-center mb-8">Add-On Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addOns.map((addon, index) => (
              <PricingPlan
                key={index}
                name={addon.name}
                description={addon.description}
                price={addon.price}
                features={addon.features}
                gradient={addon.gradient}
                icon={addon.icon}
                isMonthly={addon.isMonthly}
              />
            ))}
          </div>
        </div>

        {/* Bundle Offer */}
        <div className="max-w-md mx-auto mb-12">
          <PricingPlan
            name={bundleOffer.name}
            description={bundleOffer.description}
            price={bundleOffer.price}
            originalPrice={bundleOffer.originalPrice}
            features={bundleOffer.features}
            popular={bundleOffer.popular}
            gradient={bundleOffer.gradient}
            icon={bundleOffer.icon}
            badge={bundleOffer.badge}
          />
        </div>

        {/* UPI Payment Section */}
        <div className="text-center">
          <div className="bg-secondary/50 rounded-2xl p-8 max-w-3xl mx-auto border border-white/10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <IndianRupee className="h-8 w-8 text-hyperchat-pink" />
              <h3 className="text-2xl font-bold">Powered by UPI</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Fast, secure payments using India's most trusted payment system. 
              Pay instantly with any UPI app like PhonePe, GPay, or Paytm.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-full">
                <Check className="h-4 w-4 text-green-500" />
                <span>Instant Payments</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-full">
                <Check className="h-4 w-4 text-green-500" />
                <span>Bank-Grade Security</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-full">
                <Check className="h-4 w-4 text-green-500" />
                <span>Made for India</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
