
import React from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface PricingPlanProps {
  name: string;
  description: string;
  price: string;
  features: string[];
  popular?: boolean;
  gradient?: string;
}

const PricingPlan: React.FC<PricingPlanProps> = ({
  name,
  description,
  price,
  features,
  popular,
  gradient,
}) => {
  return (
    <div className={`rounded-2xl ${popular ? 'relative border-0 p-[1px]' : 'border border-white/10'}`}>
      {popular && (
        <div className={`absolute inset-0 rounded-2xl ${gradient} opacity-70 blur-[2px]`} />
      )}
      <div className={`h-full rounded-2xl p-6 bg-secondary/80 backdrop-blur-sm flex flex-col ${popular ? 'border-0' : ''}`}>
        {popular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-hero-gradient text-white text-xs font-medium py-1 px-3 rounded-full">
            MOST POPULAR
          </div>
        )}
        <div className="mb-6">
          <h3 className={`text-xl font-bold ${popular ? 'text-hyperchat-pink' : ''}`}>{name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="mb-4">
          <span className="text-3xl font-bold">{price}</span>
          {price !== "Free" && <span className="text-muted-foreground ml-1">/month</span>}
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
          className={`w-full ${
            popular
              ? 'bg-hero-gradient hover:opacity-90 transition-opacity'
              : 'bg-secondary hover:bg-secondary/80'
          }`}
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};

const Pricing: React.FC = () => {
  const plans = [
    {
      name: "Free",
      description: "For casual viewers",
      price: "Free",
      features: [
        "Basic chat functionality",
        "Limited customization options",
        "Support your favorite streamers",
        "Community badges",
      ],
    },
    {
      name: "HyperFan",
      description: "For dedicated fans",
      price: "$4.99",
      popular: true,
      gradient: "bg-hero-gradient",
      features: [
        "All Free features",
        "Premium message highlighting",
        "Full customization options",
        "Message pinning for 30 seconds",
        "Exclusive animated effects",
        "Fan leaderboard participation",
      ],
    },
    {
      name: "SuperFan",
      description: "For passionate supporters",
      price: "$9.99",
      features: [
        "All HyperFan features",
        "Extended message pinning (60 seconds)",
        "Custom profile badges",
        "Priority support",
        "Early access to new features",
        "Higher leaderboard multipliers",
      ],
    },
  ];

  return (
    <section id="pricing" className="py-16 md:py-24 bg-mesh-gradient">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-muted-foreground md:text-xl">
            Choose the perfect plan to elevate your streaming experience.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <PricingPlan
              key={index}
              name={plan.name}
              description={plan.description}
              price={plan.price}
              features={plan.features}
              popular={plan.popular}
              gradient={plan.gradient}
            />
          ))}
        </div>
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-6">
            Looking for custom solutions for your organization or event?
          </p>
          <Button variant="outline">Contact Us for Enterprise Options</Button>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
