
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const AnkitPage = () => {
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
      const orderId = `ankit_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      
      // Store donation data in session storage to access it during the payment flow
      const donationData = {
        name,
        amount: parseFloat(amount),
        message,
        orderId,
        donationType: "ankit", // Add donation type to differentiate
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
      className="min-h-screen bg-cover bg-center bg-no-repeat" 
      style={{ backgroundImage: `url('/lovable-uploads/93602e11-71cc-4cea-9d98-7b029b2ffe25.png')` }}
    >
      <div className="container mx-auto max-w-md py-10 px-4">
        <div className="bg-black/70 p-6 rounded-lg backdrop-blur-sm">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Make a Donation to Ankit</h1>
              <p className="text-gray-300 mt-2">
                Support Ankit's work by making a donation
              </p>
            </div>
            
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
                  className="bg-white/20 border-white/30 text-white placeholder:text-gray-400"
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
                  className="bg-white/20 border-white/30 text-white placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-300">Minimum donation amount is ₹50</p>
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
                  className="h-24 bg-white/20 border-white/30 text-white placeholder:text-gray-400"
                  disabled={isLoading}
                  maxLength={maxMessageLength}
                />
                <p className="text-xs text-gray-300">
                  {message.length}/{maxMessageLength} characters
                  {parseFloat(amount) >= 100 ? 
                    " (100 characters for donations ₹100 and above)" : 
                    " (50 characters for donations below ₹100)"}
                </p>
              </div>
              
              <div className="flex justify-center mt-6">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="relative group overflow-hidden"
                >
                  <img 
                    src="/lovable-uploads/3a9e1b67-eac7-488e-a7f9-e7da6fbbef36.png" 
                    alt="Continue to Payment" 
                    className="w-52 transform transition-transform duration-200 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-white font-bold">
                    {isLoading ? "Processing..." : "Continue to Payment"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnkitPage;
