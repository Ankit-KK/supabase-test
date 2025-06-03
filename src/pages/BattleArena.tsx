
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Shield, Crosshair, Volume2, VolumeX, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createPaymentOrder } from "@/services/paymentService";

const BattleArena = () => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [includeSound, setIncludeSound] = useState(false);
  const [militaryRank, setMilitaryRank] = useState("recruit");
  const [tacticalEffect, setTacticalEffect] = useState("smoke");
  const [isLoading, setIsLoading] = useState(false);

  const ranks = [
    { value: "recruit", label: "🔰 Recruit", description: "Fresh soldier" },
    { value: "sergeant", label: "⭐ Sergeant", description: "Squad leader" },
    { value: "captain", label: "🎖️ Captain", description: "Company commander" },
    { value: "general", label: "🎗️ General", description: "Strategic command" },
  ];

  const effects = [
    { value: "smoke", label: "💨 Smoke Screen" },
    { value: "explosion", label: "💥 Explosion" },
    { value: "airstrike", label: "✈️ Air Strike" },
    { value: "reinforcement", label: "🚁 Reinforcement" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !message) {
      toast({
        title: "Mission Briefing Incomplete",
        description: "All fields required for deployment authorization.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const orderId = `battle_arena_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const numAmount = parseFloat(amount);

      const donationData = {
        name,
        amount: numAmount,
        message,
        donationType: "battle_arena",
        include_sound: includeSound,
        military_rank: militaryRank,
        tactical_effect: tacticalEffect,
        order_id: orderId,
      };
      
      sessionStorage.setItem("donationData", JSON.stringify(donationData));

      const paymentData = await createPaymentOrder(orderId, numAmount, name, "battle_arena");
      
      if (paymentData?.payment_session_id) {
        window.location.href = `https://payments.cashfree.com/pay/${paymentData.payment_session_id}`;
      } else {
        throw new Error("Failed to create payment session");
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      toast({
        title: "Mission Aborted",
        description: "Deployment failed. Retry operation.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-slate-800 to-yellow-900 relative overflow-hidden">
      {/* Military camouflage pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M0 0h20v20H0V0zm10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm0 3a10 10 0 1 0 0-20 10 10 0 0 0 0 20z'/%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      {/* Tactical elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-16 left-20 w-16 h-16 border-2 border-green-400 rotate-45 animate-pulse"></div>
        <div className="absolute top-32 right-24 w-8 h-8 bg-orange-400 clip-polygon animate-bounce"></div>
        <div className="absolute bottom-40 left-1/3 w-12 h-12 border-2 border-yellow-400 rounded-full animate-ping"></div>
        
        {/* Radar sweep */}
        <div className="absolute top-20 right-20 w-32 h-32 border-2 border-green-400 rounded-full">
          <div className="absolute top-1/2 left-1/2 w-16 h-0.5 bg-green-400 origin-left animate-spin" style={{ transformOrigin: '0% 50%' }}></div>
        </div>
      </div>

      {/* Command Bar */}
      <nav className="bg-black/90 backdrop-blur-sm border-b-2 border-orange-400 p-4 relative z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="h-8 w-8 text-orange-400" />
            <h1 className="text-2xl font-bold text-white">
              BATTLE ARENA
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-green-400 text-black font-bold">
              OPERATIONAL
            </Badge>
            <Badge className="bg-orange-400 text-black font-bold">
              SECURE
            </Badge>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Mission Briefing */}
          <div className="flex flex-col justify-center space-y-6">
            <div className="space-y-4">
              <Badge className="bg-orange-400 text-black font-bold text-lg px-4 py-2">
                🎯 TACTICAL OPERATIONS
              </Badge>
              <h2 className="text-5xl font-bold text-white leading-tight">
                Deploy Your
                <span className="block text-orange-400">
                  Support Strike
                </span>
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                Join the tactical squad and provide strategic support! Every contribution 
                strengthens our position and helps secure victory in the digital battlefield. 🎖️
              </p>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-400" />
                <span className="text-gray-300 font-bold">TACTICAL SUPPORT</span>
              </div>
              <div className="flex items-center space-x-2">
                <Crosshair className="h-5 w-5 text-orange-400" />
                <span className="text-gray-300 font-bold">PRECISION STRIKES</span>
              </div>
            </div>
          </div>

          {/* Command Console */}
          <Card className="bg-black/80 backdrop-blur-sm border-2 border-orange-400 shadow-2xl shadow-orange-400/30">
            <CardHeader className="bg-gradient-to-r from-green-700 to-yellow-700 border-b-2 border-orange-400">
              <CardTitle className="text-2xl font-bold text-white flex items-center space-x-2">
                <Target className="h-6 w-6 text-orange-400" />
                <span>COMMAND CONSOLE</span>
              </CardTitle>
              <CardDescription className="text-orange-200 font-bold">
                Configure tactical support parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-orange-400">SOLDIER ID</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your call sign"
                    className="bg-green-900/50 border-2 border-orange-400 text-white placeholder-orange-200 font-mono text-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-orange-400">SUPPORT FUNDS (₹)</label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="50"
                    min="1"
                    className="bg-green-900/50 border-2 border-orange-400 text-white placeholder-orange-200 font-mono text-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-orange-400">SELECT RANK</label>
                  <Select value={militaryRank} onValueChange={setMilitaryRank}>
                    <SelectTrigger className="bg-green-900/50 border-2 border-orange-400 text-white font-mono">
                      <SelectValue placeholder="Choose your rank" />
                    </SelectTrigger>
                    <SelectContent className="bg-green-900 border-2 border-orange-400">
                      {ranks.map((rank) => (
                        <SelectItem key={rank.value} value={rank.value} className="text-white font-mono">
                          <div className="flex items-center space-x-2">
                            <span>{rank.label}</span>
                            <span className="text-sm text-orange-200">- {rank.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-orange-400">TACTICAL EFFECT</label>
                  <Select value={tacticalEffect} onValueChange={setTacticalEffect}>
                    <SelectTrigger className="bg-green-900/50 border-2 border-orange-400 text-white font-mono">
                      <SelectValue placeholder="Choose tactical effect" />
                    </SelectTrigger>
                    <SelectContent className="bg-green-900 border-2 border-orange-400">
                      {effects.map((effect) => (
                        <SelectItem key={effect.value} value={effect.value} className="text-white font-mono">
                          {effect.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-orange-400">MISSION BRIEF</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter your tactical message..."
                    className="bg-green-900/50 border-2 border-orange-400 text-white placeholder-orange-200 font-mono min-h-20"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeSound"
                    checked={includeSound}
                    onCheckedChange={(checked) => setIncludeSound(checked === true)}
                    className="border-2 border-orange-400 data-[state=checked]:bg-orange-400 data-[state=checked]:text-black"
                  />
                  <label htmlFor="includeSound" className="text-sm text-white font-bold flex items-center space-x-2">
                    {includeSound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    <span>COMBAT AUDIO</span>
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 text-lg border-2 border-black transition-all duration-300 transform hover:scale-105"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>DEPLOYING SUPPORT...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Target className="h-5 w-5" />
                      <span>🎯 DEPLOY SUPPORT 🎯</span>
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Command Structure */}
        <div className="mt-12">
          <Card className="bg-black/80 border-2 border-orange-400">
            <CardHeader className="bg-gradient-to-r from-green-700 to-yellow-700 border-b-2 border-orange-400">
              <CardTitle className="text-2xl font-bold text-white text-center">
                🎖️ COMMAND STRUCTURE 🎖️
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-green-900/50 border-2 border-orange-400 p-4 rounded text-center">
                  <div className="text-orange-400 font-bold text-lg mb-2">🔰 RECRUIT</div>
                  <div className="text-white font-mono mb-1">₹1 - ₹49</div>
                  <div className="text-orange-200 text-sm">Basic training support</div>
                </div>
                <div className="bg-green-900/50 border-2 border-orange-400 p-4 rounded text-center">
                  <div className="text-orange-400 font-bold text-lg mb-2">⭐ SERGEANT</div>
                  <div className="text-white font-mono mb-1">₹50 - ₹149</div>
                  <div className="text-orange-200 text-sm">Squad leader support</div>
                </div>
                <div className="bg-green-900/50 border-2 border-orange-400 p-4 rounded text-center">
                  <div className="text-orange-400 font-bold text-lg mb-2">🎖️ CAPTAIN</div>
                  <div className="text-white font-mono mb-1">₹150 - ₹299</div>
                  <div className="text-orange-200 text-sm">Company commander</div>
                </div>
                <div className="bg-green-900/50 border-2 border-orange-400 p-4 rounded text-center">
                  <div className="text-orange-400 font-bold text-lg mb-2">🎗️ GENERAL</div>
                  <div className="text-white font-mono mb-1">₹300+</div>
                  <div className="text-orange-200 text-sm">Strategic command</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BattleArena;
