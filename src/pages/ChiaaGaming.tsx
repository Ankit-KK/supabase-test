import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Gamepad2, Heart, Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ChiaaGaming = () => {
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Minimum donation amount is ₹1",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const orderId = `CHIAA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const donationData = {
        name: formData.name,
        amount: amount,
        message: formData.message,
        orderId: orderId,
        donationType: "chiaa_gaming",
        include_sound: false,
      };

      sessionStorage.setItem("donationData", JSON.stringify(donationData));
      navigate("/payment-checkout");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMessageLimit = () => {
    const amount = parseFloat(formData.amount) || 0;
    if (amount >= 500) return 200;
    if (amount >= 100) return 100;
    if (amount >= 50) return 75;
    return 50;
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background */}
      <div 
        className="absolute inset-0 opacity-95"
        style={{
          background: `
            radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(219, 39, 119, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(168, 85, 247, 0.25) 0%, transparent 50%),
            linear-gradient(135deg, #fef7ff 0%, #faf5ff 25%, #fdf2f8 50%, #f0f9ff 75%, #fef7ff 100%)
          `
        }}
      />

      {/* Floating Gaming Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 opacity-15 animate-float">
          <Heart size={60} className="text-pink-500" />
        </div>
        <div className="absolute top-32 right-20 opacity-15 animate-bounce">
          <Gamepad2 size={50} className="text-purple-500" />
        </div>
        <div className="absolute bottom-32 left-20 opacity-15 animate-pulse">
          <Sparkles size={45} className="text-pink-600" />
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Heart className="h-8 w-8 text-pink-600 animate-pulse" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-700 via-purple-700 to-pink-700 bg-clip-text text-transparent">
                Support Chiaa Gaming
              </h1>
              <Sparkles className="h-8 w-8 text-purple-600 animate-pulse" />
            </div>
            <p className="text-pink-800 text-lg font-semibold">
              Send love and support! 💕
            </p>
            <p className="text-purple-700 text-sm mt-2 font-medium">
              Your support helps create amazing gaming content
            </p>
          </div>

          {/* Donation Form */}
          <div className="backdrop-blur-lg bg-white/90 p-8 rounded-2xl border border-pink-300 shadow-2xl shadow-pink-500/25">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-pink-900">
                  Your Gaming Name ✨
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your gamer tag"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="border-pink-400 focus:border-pink-600 focus:ring-pink-600 bg-white text-gray-900 placeholder:text-gray-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="amount" className="block text-sm font-semibold text-pink-900">
                  Love Amount (₹) 💖
                </label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Enter amount (minimum ₹1)"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="border-pink-400 focus:border-pink-600 focus:ring-pink-600 bg-white text-gray-900 placeholder:text-gray-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="block text-sm font-semibold text-pink-900">
                  Sweet Message 💌
                  <span className="text-xs text-purple-700 ml-2 font-medium">
                    (Max {getMessageLimit()} characters)
                  </span>
                </label>
                <Textarea
                  id="message"
                  placeholder="Send your love and support..."
                  value={formData.message}
                  onChange={(e) => {
                    const message = e.target.value;
                    if (message.length <= getMessageLimit()) {
                      setFormData({ ...formData, message });
                    }
                  }}
                  className="border-pink-400 focus:border-pink-600 focus:ring-pink-600 bg-white text-gray-900 placeholder:text-gray-500 min-h-[100px] resize-none"
                  required
                />
                <div className="text-xs text-purple-700 text-right font-medium">
                  {formData.message.length}/{getMessageLimit()}
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-700 hover:from-pink-700 hover:to-purple-800 text-white font-bold py-3 text-lg shadow-lg shadow-pink-500/30 transition-all duration-300 hover:scale-105"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Heart className="h-5 w-5" />
                    <span>Send Love & Support</span>
                    <Zap className="h-5 w-5" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-gradient-to-r from-pink-200 to-purple-200 rounded-xl border border-pink-300">
              <h3 className="font-semibold text-pink-900 mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Message Length Guide
              </h3>
              <div className="space-y-1 text-xs text-purple-800 font-medium">
                <p>• ₹1-49: Up to 50 characters</p>
                <p>• ₹50-99: Up to 75 characters</p>
                <p>• ₹100-499: Up to 100 characters</p>
                <p>• ₹500+: Up to 200 characters</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-pink-700 font-medium">
              Payments powered by Cashfree • Secure & Fast
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChiaaGaming;
