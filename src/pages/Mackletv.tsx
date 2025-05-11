
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [selectedGif, setSelectedGif] = useState<string | null>("dancing-dog");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    if (!name.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter your name",
        variant: "destructive",
      });
      return false;
    }

    if (!selectedGif) {
      toast({
        title: "GIF is required",
        description: "Please select a GIF",
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
      // For MackleTv, we only have GIF purchases, fixed at ₹500
      const totalAmount = 500; // Fixed amount for any GIF
      
      // Generate a random order ID with timestamp
      const orderId = `mackletv_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      
      // Store donation data in session storage to access it during the payment flow
      const donationData = {
        name,
        amount: 0,  // Always 0 because the GIF itself is the purchase
        totalAmount,
        message: `${name} purchased ${selectedGif} GIF`, // Auto-generated message since users don't enter one
        orderId,
        donationType: "mackletv",
        includeGif: true,
        selectedGif,
      };
      
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
          <h1 className="text-3xl font-bold">Support MackleTv with GIFs</h1>
          <p className="text-muted-foreground mt-2">
            Purchase a celebratory GIF to show on MackleTv's stream
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">1. Choose a GIF</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">2. Enter your name</h2>
            <div className="space-y-2">
              <Input 
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                disabled={isLoading}
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground">
                This will be displayed along with your GIF
              </p>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full max-w-md mx-auto"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Continue to Payment (₹500)"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default MackleTvPage;
