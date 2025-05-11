
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

// GIF options
const gifOptions = [
  { 
    id: "dancing-dog", 
    name: "Dancing Dog",
    url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/sign/ankit/dancing-dog.gif?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhbmtpdC9kYW5jaW5nLWRvZy5naWYiLCJpYXQiOjE3NDY4OTc4ODEsImV4cCI6MTc3ODQzMzg4MX0.tIzwiI3aBlSujCQIn0zQfUGLXfsMPc4wEgrpPZO15_k",
    price: 500,
    available: true
  },
  { 
    id: "coming-soon-1", 
    name: "Coming Soon",
    url: "/placeholder.svg",
    price: 500,
    available: false
  },
  { 
    id: "coming-soon-2", 
    name: "Coming Soon",
    url: "/placeholder.svg", 
    price: 500,
    available: false
  },
  { 
    id: "coming-soon-3", 
    name: "Coming Soon",
    url: "/placeholder.svg",
    price: 500,
    available: false
  },
  { 
    id: "coming-soon-4", 
    name: "Coming Soon",
    url: "/placeholder.svg",
    price: 500,
    available: false
  }
];

const MackleTvPage = () => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<number>(100);
  const [message, setMessage] = useState("");
  const [selectedGif, setSelectedGif] = useState<string | null>("dancing-dog");
  const [includeGif, setIncludeGif] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // Define donation tiers
  const donationTiers = [
    { value: 100, label: "₹100" },
    { value: 500, label: "₹500" },
    { value: 1000, label: "₹1000" },
    { value: 2000, label: "₹2000" },
    { value: 5000, label: "₹5000" }
  ];

  const validateForm = () => {
    if (!name.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter your name",
        variant: "destructive",
      });
      return false;
    }

    if (includeGif && !selectedGif) {
      toast({
        title: "GIF is required",
        description: "Please select a GIF or disable the GIF option",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Calculate total amount (donation + GIF if selected)
      const gifCost = includeGif ? 500 : 0;
      const totalAmount = amount + gifCost;
      
      // Generate a random order ID with timestamp
      const orderId = `mackletv_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      
      console.log("Creating donation with order ID:", orderId);
      
      // Store donation data in session storage to access it during the payment flow
      const donationData = {
        name,
        amount,
        totalAmount,
        message,
        orderId,
        donationType: "mackletv",
        includeGif,
        selectedGif: includeGif ? selectedGif : null,
      };
      
      console.log("Storing donation data in session:", donationData);
      sessionStorage.setItem("donationData", JSON.stringify(donationData));
      
      // Navigate to payment checkout
      navigate("/payment-checkout");
    } catch (error) {
      console.error("Error preparing payment:", error);
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-10">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Support MackleTv</h1>
          <p className="text-muted-foreground mt-2">
            Your donations help MackleTv continue creating awesome content
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">1. Choose a Donation Amount</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {donationTiers.map((tier) => (
                <button
                  key={tier.value}
                  type="button"
                  className={`py-2 px-4 border rounded-md transition-colors ${
                    amount === tier.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-input hover:bg-muted"
                  }`}
                  onClick={() => setAmount(tier.value)}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">2. Your Information</h2>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea 
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a message for MackleTv"
                disabled={isLoading}
                rows={3}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">3. Add a GIF (₹500)</h2>
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-gif"
                  checked={includeGif}
                  onCheckedChange={setIncludeGif}
                />
                <Label htmlFor="include-gif">Include GIF</Label>
              </div>
            </div>
            
            {includeGif && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {gifOptions.map((gif) => (
                  <Card 
                    key={gif.id}
                    className={`relative overflow-hidden cursor-pointer transition-all ${
                      selectedGif === gif.id ? 'ring-2 ring-primary' : ''
                    } ${!gif.available ? 'opacity-60' : ''}`}
                    onClick={() => gif.available && setSelectedGif(gif.id)}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-square flex items-center justify-center bg-muted rounded-md overflow-hidden">
                        <img 
                          src={gif.url} 
                          alt={gif.name} 
                          className="object-contain max-h-full max-w-full"
                        />
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{gif.name}</p>
                          <p className="text-sm text-muted-foreground">₹{gif.price}</p>
                        </div>
                        {!gif.available && (
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            Coming Soon
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : `Donate ₹${amount + (includeGif ? 500 : 0)}`}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default MackleTvPage;
