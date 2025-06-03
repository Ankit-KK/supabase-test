
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Circuit, Gamepad2, Volume2, VolumeX } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createPaymentOrder, createDonationRecord } from "@/services/paymentService";

const CyberStriker = () => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [includeSound, setIncludeSound] = useState(false);
  const [includeEffects, setIncludeEffects] = useState(false);
  const [donationTier, setDonationTier] = useState("basic");
  const [isLoading, setIsLoading] = useState(false);

  const getDonationTier = (amount: number) => {
    if (amount >= 500) return "legendary";
    if (amount >= 200) return "premium";
    return "basic";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !message) {
      toast({
        title: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const orderId = `cyber_striker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const numAmount = parseFloat(amount);
      const tier = getDonationTier(numAmount);

      // Store donation data in session storage
      const donationData = {
        name,
        amount: numAmount,
        message,
        donationType: "cyber_striker",
        include_sound: includeSound,
        include_effects: includeEffects,
        donation_tier: tier,
        order_id: orderId,
      };
      
      sessionStorage.setItem("donationData", JSON.stringify(donationData));

      // Create payment order
      const paymentData = await createPaymentOrder(orderId, numAmount, name, "cyber_striker");
      
      if (paymentData?.payment_session_id) {
        // Redirect to Cashfree payment page
        window.location.href = `https://payments.cashfree.com/pay/${paymentData.payment_session_id}`;
      } else {
        throw new Error("Failed to create payment session");
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      toast({
        title: "Payment Error",
        description: "Failed to create payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background circuit pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 border border-cyan-400 rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-20 w-24 h-24 border border-purple-400 rounded-lg animate-bounce"></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-cyan-400/20 rounded-full animate-ping"></div>
      </div>

      {/* Navbar */}
      <nav className="bg-black/50 backdrop-blur-sm border-b border-cyan-400/30 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Circuit className="h-8 w-8 text-cyan-400" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              CYBER STRIKER
            </h1>
          </div>
          <Badge variant="outline" className="border-cyan-400 text-cyan-400">
            NEURAL LINK ACTIVE
          </Badge>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Hero Section */}
          <div className="flex flex-col justify-center space-y-6">
            <div className="space-y-4">
              <Badge className="bg-cyan-400/20 text-cyan-400 border-cyan-400">
                CYBERPUNK GAMING EXPERIENCE
              </Badge>
              <h2 className="text-5xl font-bold text-white leading-tight">
                Enter the
                <span className="block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Digital Arena
                </span>
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                Support your favorite cyber warrior with neural-enhanced donations. 
                Every contribution powers up the digital revolution.
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                <span className="text-gray-300">Real-time effects</span>
              </div>
              <div className="flex items-center space-x-2">
                <Gamepad2 className="h-5 w-5 text-cyan-400" />
                <span className="text-gray-300">Gaming optimized</span>
              </div>
            </div>
          </div>

          {/* Donation Form */}
          <Card className="bg-black/40 backdrop-blur-sm border-cyan-400/30 shadow-2xl shadow-cyan-400/20">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white flex items-center space-x-2">
                <Circuit className="h-6 w-6 text-cyan-400" />
                <span>Neural Link Transfer</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Initialize secure quantum transaction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-cyan-400">Operative ID</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your call sign"
                    className="bg-slate-800/50 border-cyan-400/30 text-white placeholder-gray-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-cyan-400">Credit Amount (₹)</label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      const tier = getDonationTier(parseFloat(e.target.value) || 0);
                      setDonationTier(tier);
                    }}
                    placeholder="100"
                    min="1"
                    className="bg-slate-800/50 border-cyan-400/30 text-white placeholder-gray-500"
                    required
                  />
                  {amount && (
                    <Badge 
                      className={`ml-2 ${
                        getDonationTier(parseFloat(amount)) === 'legendary' 
                          ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400' 
                          : getDonationTier(parseFloat(amount)) === 'premium'
                          ? 'bg-purple-400/20 text-purple-400 border-purple-400'
                          : 'bg-cyan-400/20 text-cyan-400 border-cyan-400'
                      }`}
                      variant="outline"
                    >
                      {getDonationTier(parseFloat(amount)).toUpperCase()} TIER
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-cyan-400">Neural Message</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Transmit your message through the neural network..."
                    className="bg-slate-800/50 border-cyan-400/30 text-white placeholder-gray-500 min-h-20"
                    required
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeSound"
                      checked={includeSound}
                      onCheckedChange={setIncludeSound}
                      className="border-cyan-400 data-[state=checked]:bg-cyan-400"
                    />
                    <label htmlFor="includeSound" className="text-sm text-gray-300 flex items-center space-x-2">
                      {includeSound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      <span>Enable audio alerts</span>
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeEffects"
                      checked={includeEffects}
                      onCheckedChange={setIncludeEffects}
                      className="border-cyan-400 data-[state=checked]:bg-cyan-400"
                    />
                    <label htmlFor="includeEffects" className="text-sm text-gray-300 flex items-center space-x-2">
                      <Zap className="h-4 w-4" />
                      <span>Activate visual effects</span>
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold py-3 transition-all duration-300 transform hover:scale-105"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Initializing Transfer...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Circuit className="h-4 w-4" />
                      <span>Execute Neural Transfer</span>
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Tier Information */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Card className="bg-cyan-400/10 border-cyan-400/30">
            <CardHeader>
              <CardTitle className="text-cyan-400">Basic Tier</CardTitle>
              <CardDescription>₹1 - ₹199</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm">Standard neural link with basic effects</p>
            </CardContent>
          </Card>

          <Card className="bg-purple-400/10 border-purple-400/30">
            <CardHeader>
              <CardTitle className="text-purple-400">Premium Tier</CardTitle>
              <CardDescription>₹200 - ₹499</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm">Enhanced neural link with advanced effects</p>
            </CardContent>
          </Card>

          <Card className="bg-yellow-400/10 border-yellow-400/30">
            <CardHeader>
              <CardTitle className="text-yellow-400">Legendary Tier</CardTitle>
              <CardDescription>₹500+</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm">Ultimate neural link with maximum effects</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CyberStriker;
