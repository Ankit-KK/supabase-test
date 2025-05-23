
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Heart, Star, Sparkles, Play } from "lucide-react";

const ChiaGamingPage = () => {
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
      const orderId = `chia_gaming_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      
      // Store donation data in session storage to access it during the payment flow
      const donationData = {
        name,
        amount: parseFloat(amount),
        message,
        orderId,
        donationType: "chia_gaming",
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
          radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(219, 39, 119, 0.3) 0%, transparent 50%),
          linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #fdf2f8 100%)
        `
      }}
    >
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 opacity-20">
          <Heart size={60} className="text-pink-400 animate-pulse" />
        </div>
        <div className="absolute top-20 right-20 opacity-15">
          <Star size={80} className="text-pink-500 animate-bounce" style={{ animationDelay: '1s' }} />
        </div>
        <div className="absolute bottom-32 left-20 opacity-20">
          <Sparkles size={50} className="text-purple-400 animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        <div className="absolute top-1/2 right-32 opacity-10">
          <Play size={70} className="text-pink-600 animate-bounce" style={{ animationDelay: '0.5s' }} />
        </div>
        
        {/* Cloud-like decorations */}
        <div className="absolute top-1/4 left-1/4 w-32 h-20 bg-white/20 rounded-full blur-sm opacity-30"></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-16 bg-pink-200/30 rounded-full blur-sm opacity-40"></div>
      </div>

      {/* Soft border effect */}
      <div className="absolute inset-4 border-2 border-pink-300/30 rounded-xl shadow-lg shadow-pink-300/20 pointer-events-none"></div>
      
      <div className="container mx-auto max-w-md py-10 relative z-10">
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <Heart className="h-8 w-8 text-pink-500" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600 bg-clip-text text-transparent">
                Support Chia Gaming
              </h1>
              <Sparkles className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-pink-700 text-lg">
              Spread love and support our gaming journey! 💖
            </p>
            <div className="bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 mx-auto w-fit">
              <span className="text-pink-600 font-medium">✨ Subscribe Now! ✨</span>
            </div>
          </div>
          
          <div className="backdrop-blur-lg bg-white/50 p-6 rounded-xl border-2 border-pink-200/50 shadow-2xl shadow-pink-300/20">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-pink-700">
                  Your Sweet Name 💕
                </label>
                <Input 
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your adorable name"
                  disabled={isLoading}
                  className="bg-white/70 border-pink-300 text-pink-900 placeholder:text-pink-400 focus:border-pink-500 focus:ring-pink-400/50 rounded-lg"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="amount" className="block text-sm font-medium text-pink-700">
                  Love Amount (₹) 💖
                </label>
                <Input 
                  id="amount"
                  type="number"
                  min="50"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Minimum ₹50"
                  disabled={isLoading}
                  className="bg-white/70 border-pink-300 text-pink-900 placeholder:text-pink-400 focus:border-pink-500 focus:ring-pink-400/50 rounded-lg"
                />
                <p className="text-xs text-pink-600">Minimum love level is ₹50 💝</p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="message" className="block text-sm font-medium text-pink-700">
                  Sweet Message ✨
                </label>
                <Textarea 
                  id="message"
                  value={message}
                  onChange={handleMessageChange}
                  placeholder="Send your cute and supportive message! 🌸"
                  className="h-24 bg-white/70 border-pink-300 text-pink-900 placeholder:text-pink-400 focus:border-pink-500 focus:ring-pink-400/50 rounded-lg"
                  disabled={isLoading}
                  maxLength={maxMessageLength}
                />
                <p className="text-xs text-pink-600">
                  {message.length}/{maxMessageLength} characters
                  {parseFloat(amount) >= 100 ? 
                    " (100 chars for ₹100+ donations) 🎀" : 
                    " (50 chars for donations below ₹100) 🌺"}
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-3 rounded-lg shadow-lg shadow-pink-400/25 transition-all duration-300 transform hover:scale-105 border-2 border-pink-300/50"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Processing Love...</span>
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

export default ChiaGamingPage;
