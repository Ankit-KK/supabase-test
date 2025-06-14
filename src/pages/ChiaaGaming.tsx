
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Heart, Gift, Users, Star } from "lucide-react";
import Footer from "@/components/Footer";

const ChiaaGaming = () => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [includeSound, setIncludeSound] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) < 1) {
      toast({
        title: "Invalid Amount",
        description: "Please enter an amount of at least ₹1",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Generate order ID
      const orderId = `chiaa_gaming_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store donation data in session storage
      const donationData = {
        name: name.trim(),
        amount: parseFloat(amount),
        message: message.trim(),
        orderId,
        donationType: "chiaa_gaming",
        include_sound: includeSound
      };
      
      sessionStorage.setItem("donationData", JSON.stringify(donationData));
      
      // Navigate to payment checkout
      navigate(`/payment/${donationData.donationType}?order_id=${orderId}`);
      
    } catch (error) {
      console.error("Error processing donation:", error);
      toast({
        title: "Error",
        description: "Failed to process donation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickAmounts = [10, 25, 50, 100, 500, 1000];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Support Chiaa Gaming
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Show your love and support for Chiaa Gaming's amazing content! Every donation helps create better gaming experiences.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
              <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">10K+</div>
              <div className="text-sm text-gray-300">Followers</div>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
              <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">500+</div>
              <div className="text-sm text-gray-300">Streams</div>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
              <Gift className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">1K+</div>
              <div className="text-sm text-gray-300">Donations</div>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
              <Heart className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">100%</div>
              <div className="text-sm text-gray-300">Love</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">
                Send a Donation
              </CardTitle>
              <CardDescription className="text-gray-300">
                Support Chiaa Gaming and send a message that will appear on stream!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Input */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Your Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    required
                  />
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-white">Donation Amount (₹)</Label>
                  <div className="space-y-3">
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="1"
                      step="1"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      required
                    />
                    
                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {quickAmounts.map((quickAmount) => (
                        <Button
                          key={quickAmount}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAmount(quickAmount.toString())}
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          ₹{quickAmount}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Message Input */}
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-white">Your Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Send a message to Chiaa Gaming..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 min-h-[100px]"
                    maxLength={500}
                    required
                  />
                  <div className="text-right text-sm text-gray-400">
                    {message.length}/500 characters
                  </div>
                </div>

                {/* Include Sound Option */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeSound"
                    checked={includeSound}
                    onCheckedChange={setIncludeSound}
                    className="border-white/20"
                  />
                  <Label htmlFor="includeSound" className="text-white text-sm">
                    Include sound notification (₹25+)
                  </Label>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : `Donate ₹${amount || "0"}`}
                </Button>
              </form>

              {/* Additional Info */}
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-300">
                  🔒 Secure payments powered by Cashfree
                </p>
                <p className="text-xs text-gray-400">
                  Your donation will appear on stream with your message!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
              <Gift className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Instant Notifications</h3>
              <p className="text-gray-300">Your donation and message appear instantly on stream</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
              <Heart className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Show Support</h3>
              <p className="text-gray-300">Help Chiaa Gaming create amazing content</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
              <Users className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Join Community</h3>
              <p className="text-gray-300">Be part of the amazing Chiaa Gaming community</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ChiaaGaming;
