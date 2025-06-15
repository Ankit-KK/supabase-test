import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Heart, Gamepad2 } from "lucide-react";

const ChiaaGamingPage = () => {
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
    if (isNaN(parsedAmount) || parsedAmount < 1) {
      toast({
        title: "Invalid amount",
        description: "Please enter an amount greater than or equal to ₹1",
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
      const orderId = `chiaa_gaming_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      
      console.log("Creating Chiaa Gaming donation with order ID:", orderId);
      
      // Store donation data in session storage to access it during the payment flow
      const donationData = {
        name: name.trim(),
        amount: parseFloat(amount),
        message: message.trim(),
        orderId,
        donationType: "chiaa_gaming",
      };
      
      sessionStorage.setItem("donationData", JSON.stringify(donationData));
      console.log("Stored Chiaa Gaming donation data in session storage");
      
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
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url('/lovable-uploads/7d0bcc0f-fdef-47a2-9c88-4a052346971f.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30"></div>
      
      {/* Gaming Elements Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 opacity-30">
          <Heart size={80} className="text-pink-400 animate-pulse" />
        </div>
        <div className="absolute bottom-20 right-20 opacity-30">
          <Gamepad2 size={100} className="text-pink-400 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      {/* Pink Border Effect */}
      <div className="absolute inset-4 border-2 border-pink-400/40 rounded-lg shadow-lg shadow-pink-400/20 pointer-events-none"></div>
      
      <div className="container mx-auto max-w-md py-10 relative z-10">
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <Heart className="h-8 w-8 text-pink-400" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 bg-clip-text text-transparent">
                Support Chiaa Gaming
              </h1>
              <Heart className="h-8 w-8 text-pink-400" />
            </div>
            <p className="text-white/90 text-lg font-medium">
              Send love and support to your favorite gamer!
            </p>
          </div>
          
          <div className="backdrop-blur-lg bg-white/20 p-6 rounded-xl border border-pink-400/30 shadow-2xl shadow-pink-400/20">
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
                  className="bg-white/90 border-pink-300 text-gray-800 placeholder:text-gray-500 focus:border-pink-500 focus:ring-pink-500/50"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="amount" className="block text-sm font-medium text-white">
                  Donation Amount (₹)
                </label>
                <Input 
                  id="amount"
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Minimum ₹1"
                  disabled={isLoading}
                  className="bg-white/90 border-pink-300 text-gray-800 placeholder:text-gray-500 focus:border-pink-500 focus:ring-pink-500/50"
                />
                <p className="text-xs text-white/80">Minimum donation is ₹1</p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="message" className="block text-sm font-medium text-white">
                  Sweet Message
                </label>
                <Textarea 
                  id="message"
                  value={message}
                  onChange={handleMessageChange}
                  placeholder="Send your sweet message to Chiaa!"
                  className="h-24 bg-white/90 border-pink-300 text-gray-800 placeholder:text-gray-500 focus:border-pink-500 focus:ring-pink-500/50 resize-none"
                  disabled={isLoading}
                  maxLength={maxMessageLength}
                />
                <p className="text-xs text-white/80">
                  {message.length}/{maxMessageLength} characters
                  {parseFloat(amount) >= 100 ? 
                    " (100 chars for ₹100+ donations)" : 
                    " (50 chars for donations below ₹100)"}
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-pink-500/25 transition-all duration-300 transform hover:scale-105 border border-pink-400/50"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Heart className="h-4 w-4" />
                    <span>Send Love & Support</span>
                    <Heart className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChiaaGamingPage;
