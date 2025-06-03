
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket, Satellite, Zap, Volume2, VolumeX, Globe } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createPaymentOrder } from "@/services/paymentService";

const SpaceCommand = () => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [includeSound, setIncludeSound] = useState(false);
  const [shipType, setShipType] = useState("fighter");
  const [warpEffect, setWarpEffect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const ships = [
    { value: "fighter", label: "🚀 Fighter", description: "Fast and agile" },
    { value: "cruiser", label: "🛸 Cruiser", description: "Balanced vessel" },
    { value: "battleship", label: "🚁 Battleship", description: "Heavy artillery" },
    { value: "explorer", label: "🛰️ Explorer", description: "Deep space mission" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !message) {
      toast({
        title: "Transmission Failed",
        description: "Please complete all fields for successful launch.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const orderId = `space_command_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const numAmount = parseFloat(amount);

      const donationData = {
        name,
        amount: numAmount,
        message,
        donationType: "space_command",
        include_sound: includeSound,
        ship_type: shipType,
        warp_effect: warpEffect,
        order_id: orderId,
      };
      
      sessionStorage.setItem("donationData", JSON.stringify(donationData));

      const paymentData = await createPaymentOrder(orderId, numAmount, name, "space_command");
      
      if (paymentData?.payment_session_id) {
        window.location.href = `https://payments.cashfree.com/pay/${paymentData.payment_session_id}`;
      } else {
        throw new Error("Failed to create payment session");
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      toast({
        title: "Launch Aborted",
        description: "Mission failed to initialize. Please retry.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Starfield background */}
      <div className="absolute inset-0">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 1}s`,
            }}
          ></div>
        ))}
        
        {/* Planets */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute bottom-32 left-16 w-24 h-24 bg-gradient-to-br from-red-400 to-orange-500 rounded-full opacity-50 animate-float"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-40 animate-bounce"></div>
      </div>

      {/* Navbar */}
      <nav className="bg-black/80 backdrop-blur-sm border-b border-blue-400/50 p-4 relative z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Rocket className="h-8 w-8 text-blue-400" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              SPACE COMMAND
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="border-blue-400 text-blue-400">
              MISSION ACTIVE
            </Badge>
            <Badge variant="outline" className="border-green-400 text-green-400">
              SYSTEMS ONLINE
            </Badge>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Hero Section */}
          <div className="flex flex-col justify-center space-y-6">
            <div className="space-y-4">
              <Badge className="bg-blue-400/20 text-blue-400 border-blue-400 text-lg px-4 py-2">
                🚀 GALACTIC EXPLORATION
              </Badge>
              <h2 className="text-5xl font-bold text-white leading-tight">
                Launch Your
                <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Support Mission
                </span>
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                Fuel the next space exploration mission! Your support helps navigate 
                through the vast cosmos and discover new gaming frontiers. 🌌
              </p>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Satellite className="h-5 w-5 text-blue-400" />
                <span className="text-gray-300">Real-time tracking</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-cyan-400" />
                <span className="text-gray-300">Galactic network</span>
              </div>
            </div>
          </div>

          {/* Mission Control Panel */}
          <Card className="bg-black/60 backdrop-blur-sm border border-blue-400/50 shadow-2xl shadow-blue-400/20 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-cyan-400/5 rounded-lg"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl font-bold text-white flex items-center space-x-2">
                <Rocket className="h-6 w-6 text-blue-400" />
                <span>MISSION CONTROL</span>
              </CardTitle>
              <CardDescription className="text-blue-200">
                Configure your support payload and prepare for launch
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-blue-400">COMMANDER ID</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your space call sign"
                    className="bg-slate-800/70 border-blue-400/50 text-white placeholder-gray-400 font-mono"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-blue-400">FUEL UNITS (₹)</label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100"
                    min="1"
                    className="bg-slate-800/70 border-blue-400/50 text-white placeholder-gray-400 font-mono"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-blue-400">SELECT SPACECRAFT</label>
                  <Select value={shipType} onValueChange={setShipType}>
                    <SelectTrigger className="bg-slate-800/70 border-blue-400/50 text-white font-mono">
                      <SelectValue placeholder="Choose your vessel" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-blue-400/50">
                      {ships.map((ship) => (
                        <SelectItem key={ship.value} value={ship.value} className="text-white font-mono">
                          <div className="flex items-center space-x-2">
                            <span>{ship.label}</span>
                            <span className="text-sm text-blue-200">- {ship.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-blue-400">TRANSMISSION MESSAGE</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Send your message across the galaxy..."
                    className="bg-slate-800/70 border-blue-400/50 text-white placeholder-gray-400 font-mono min-h-20"
                    required
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeSound"
                      checked={includeSound}
                      onCheckedChange={(checked) => setIncludeSound(checked === true)}
                      className="border-blue-400 data-[state=checked]:bg-blue-400"
                    />
                    <label htmlFor="includeSound" className="text-sm text-gray-300 flex items-center space-x-2">
                      {includeSound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      <span>Enable space communications</span>
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="warpEffect"
                      checked={warpEffect}
                      onCheckedChange={(checked) => setWarpEffect(checked === true)}
                      className="border-blue-400 data-[state=checked]:bg-blue-400"
                    />
                    <label htmlFor="warpEffect" className="text-sm text-gray-300 flex items-center space-x-2">
                      <Zap className="h-4 w-4" />
                      <span>Activate warp drive effects</span>
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 transition-all duration-300 transform hover:scale-105"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>LAUNCHING MISSION...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Rocket className="h-4 w-4" />
                      <span>🚀 LAUNCH MISSION 🚀</span>
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Fleet Information */}
        <div className="mt-12">
          <Card className="bg-black/60 backdrop-blur-sm border border-blue-400/50">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white text-center">
                🛸 FLEET SPECIFICATIONS 🛸
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 border border-blue-400/30 p-4 rounded-lg text-center">
                  <div className="text-blue-400 font-bold text-lg mb-2">🚀 FIGHTER</div>
                  <div className="text-white font-mono mb-1">₹1 - ₹99</div>
                  <div className="text-blue-200 text-sm">Quick reconnaissance</div>
                </div>
                <div className="bg-slate-800/50 border border-blue-400/30 p-4 rounded-lg text-center">
                  <div className="text-blue-400 font-bold text-lg mb-2">🛸 CRUISER</div>
                  <div className="text-white font-mono mb-1">₹100 - ₹249</div>
                  <div className="text-blue-200 text-sm">Standard exploration</div>
                </div>
                <div className="bg-slate-800/50 border border-blue-400/30 p-4 rounded-lg text-center">
                  <div className="text-blue-400 font-bold text-lg mb-2">🚁 BATTLESHIP</div>
                  <div className="text-white font-mono mb-1">₹250 - ₹499</div>
                  <div className="text-blue-200 text-sm">Heavy assault mission</div>
                </div>
                <div className="bg-slate-800/50 border border-blue-400/30 p-4 rounded-lg text-center">
                  <div className="text-blue-400 font-bold text-lg mb-2">🛰️ EXPLORER</div>
                  <div className="text-white font-mono mb-1">₹500+</div>
                  <div className="text-blue-200 text-sm">Deep space expedition</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SpaceCommand;
