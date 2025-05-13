import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

const MacklePage = () => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [maxMessageLength, setMaxMessageLength] = useState(50);
  const navigate = useNavigate();

  // Update max message length based on amount
  useEffect(() => {
    const parsedAmount = parseFloat(amount);
    if (!isNaN(parsedAmount) && parsedAmount >= 100) {
      setMaxMessageLength(100);
    } else {
      setMaxMessageLength(50);
    }
  }, [amount]);

  const validateForm = () => {
    if (!name.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter your name",
        variant: "destructive",
      });
      return false;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 50) {
      toast({
        title: "Invalid amount",
        description: "Please enter an amount greater than or equal to ₹50",
        variant: "destructive",
      });
      return false;
    }

    if (!message.trim()) {
      toast({
        title: "Message is required",
        description: "Please enter a message",
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
      // Generate a random order ID with timestamp
      const orderId = `mackle_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      
      // Store donation data in session storage to access it during the payment flow
      const donationData = {
        name,
        amount: parseFloat(amount),
        message,
        orderId,
        donationType: "mackle", // Add donation type to differentiate
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

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Limit message to maxMessageLength characters
    const value = e.target.value;
    if (value.length <= maxMessageLength) {
      setMessage(value);
    }
  };

  return (
    <div 
      className="min-h-screen py-10 px-4"
      style={{
        backgroundImage: "url('https://github.com/Ankitak-ai/hype-chat-spark/blob/main/public/lovable-uploads/f097dece-abfa-4962-9cf9-6d5fa500c509.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      <div className="container mx-auto max-w-md">
        <Card className="p-6 backdrop-blur-sm bg-black/70 border border-red-600/30">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-white">
                Support MACKLETV
              </h1>
              <p className="text-gray-300 mt-2">
                Your donation helps keep the content coming
              </p>
            </div>
            
            <div className="rounded-xl p-4 mb-4 border border-red-500/30 bg-black/50">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-white">
                    Your Name
                  </label>
                  <Input 
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    disabled={isLoading}
                    className="bg-black/50 border-red-500/50 focus:border-red-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="amount" className="block text-sm font-medium text-white">
                    Amount (₹)
                  </label>
                  <Input 
                    id="amount"
                    type="number"
                    min="50"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Minimum ₹50"
                    disabled={isLoading}
                    className="bg-black/50 border-red-500/50 focus:border-red-500"
                  />
                  <p className="text-xs text-gray-400">Minimum donation amount is ₹50</p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="message" className="block text-sm font-medium text-white">
                    Message
                  </label>
                  <Textarea 
                    id="message"
                    value={message}
                    onChange={handleMessageChange}
                    placeholder="Enter your message"
                    className="h-24 bg-black/50 border-red-500/50 focus:border-red-500"
                    disabled={isLoading}
                    maxLength={maxMessageLength}
                  />
                  <p className="text-xs text-gray-400">
                    {message.length}/{maxMessageLength} characters
                    {parseFloat(amount) >= 100 ? 
                      " (100 characters for donations ₹100 and above)" : 
                      " (50 characters for donations below ₹100)"}
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white"
                  disabled={isLoading}
                >
                  <div className="flex items-center justify-center gap-2">
                    <img 
                      src="/lovable-uploads/93602e11-71cc-4cea-9d98-7b029b2ffe25.png" 
                      alt="Mackle" 
                      className="h-8 w-8 rounded-full"
                    />
                    {isLoading ? "Processing..." : "Continue to Payment"}
                  </div>
                </Button>
              </form>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MacklePage;
