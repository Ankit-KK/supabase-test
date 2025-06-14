
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Gamepad2, Zap, Trophy } from "lucide-react";

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
      const orderId = `ankit_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      
      console.log("Creating donation with order ID:", orderId);
      
      // Store donation data in session storage to access it during the payment flow
      const donationData = {
        name: name.trim(),
        amount: parseFloat(amount),
        message: message.trim(),
        orderId,
        donationType: "ankit",
      };
      
      sessionStorage.setItem("donationData", JSON.stringify(donationData));
      console.log("Stored donation data in session storage");
      
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
        background: `
          radial-gradient(circle at 20% 80%, rgba(168, 85, 247, 0.4) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.4) 0%, transparent 50%),
          linear-gradient(135deg, #1e1b4b 0%, #581c87 50%, #7c2d12 100%)
        `
      }}
    >
      {/* Gaming Controller Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 opacity-20">
          <Gamepad2 size={120} className="text-purple-400 animate-pulse" />
        </div>
        <div className="absolute bottom-20 right-20 opacity-20">
          <Gamepad2 size={150} className="text-pink-400 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="absolute top-1/2 right-10 opacity-10">
          <Trophy size={100} className="text-yellow-400 animate-bounce" style={{ animationDelay: '2s' }} />
        </div>
      </div>

      {/* Neon Border Effect */}
      <div className="absolute inset-4 border-2 border-purple-500/30 rounded-lg shadow-lg shadow-purple-500/20 pointer-events-none"></div>
      
      <div className="container mx-auto max-w-md py-10 relative z-10">
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <Gamepad2 className="h-8 w-8 text-purple-400" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent">
                Support Ankit
              </h1>
              <Zap className="h-8 w-8 text-pink-400" />
            </div>
            <p className="text-purple-200">
              Power up the stream with your awesome donation!
            </p>
          </div>
          
          <div className="backdrop-blur-lg bg-black/40 p-6 rounded-xl border border-purple-500/30 shadow-2xl shadow-purple-500/20">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-purple-200">
                  Gamer Tag
                </label>
                <Input 
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your gamer name"
                  disabled={isLoading}
                  className="bg-black/50 border-purple-500/50 text-white placeholder:text-purple-300 focus:border-pink-400 focus:ring-pink-400/50"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="amount" className="block text-sm font-medium text-purple-200">
                  Power Level (₹)
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
                  className="bg-black/50 border-purple-500/50 text-white placeholder:text-purple-300 focus:border-pink-400 focus:ring-pink-400/50"
                />
                <p className="text-xs text-purple-300">Minimum power level is ₹1</p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="message" className="block text-sm font-medium text-purple-200">
                  Epic Message
                </label>
                <Textarea 
                  id="message"
                  value={message}
                  onChange={handleMessageChange}
                  placeholder="Send your epic message to the stream!"
                  className="h-24 bg-black/50 border-purple-500/50 text-white placeholder:text-purple-300 focus:border-pink-400 focus:ring-pink-400/50 resize-none"
                  disabled={isLoading}
                  maxLength={maxMessageLength}
                />
                <p className="text-xs text-purple-300">
                  {message.length}/{maxMessageLength} characters
                  {parseFloat(amount) >= 100 ? 
                    " (100 chars for ₹100+ donations)" : 
                    " (50 chars for donations below ₹100)"}
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 border border-purple-400/50"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Zap className="h-4 w-4" />
                    <span>Power Up Stream</span>
                    <Zap className="h-4 w-4" />
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

export default AnkitPage;
