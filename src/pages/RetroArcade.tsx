
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, Star, Heart, Volume2, VolumeX, Trophy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createPaymentOrder } from "@/services/paymentService";

const RetroArcade = () => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [includeSound, setIncludeSound] = useState(false);
  const [powerupType, setPowerupType] = useState("coin");
  const [pixelAnimation, setPixelAnimation] = useState("bounce");
  const [isLoading, setIsLoading] = useState(false);

  const powerups = [
    { value: "coin", label: "🪙 Coin", description: "Classic golden coin" },
    { value: "star", label: "⭐ Star", description: "Sparkling star power" },
    { value: "mushroom", label: "🍄 Mushroom", description: "Power-up mushroom" },
    { value: "heart", label: "❤️ Heart", description: "Extra life heart" },
  ];

  const animations = [
    { value: "bounce", label: "Bounce" },
    { value: "flash", label: "Flash" },
    { value: "spin", label: "Spin" },
    { value: "zoom", label: "Zoom" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !message) {
      toast({
        title: "GAME OVER",
        description: "Please insert coin and fill all fields!",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const orderId = `retro_arcade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const numAmount = parseFloat(amount);

      const donationData = {
        name,
        amount: numAmount,
        message,
        donationType: "retro_arcade",
        include_sound: includeSound,
        powerup_type: powerupType,
        pixel_animation: pixelAnimation,
        order_id: orderId,
      };
      
      sessionStorage.setItem("donationData", JSON.stringify(donationData));

      const paymentData = await createPaymentOrder(orderId, numAmount, name, "retro_arcade");
      
      if (paymentData?.payment_session_id) {
        window.location.href = `https://payments.cashfree.com/pay/${paymentData.payment_session_id}`;
      } else {
        throw new Error("Failed to create payment session");
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      toast({
        title: "CONNECTION ERROR",
        description: "Failed to insert coin. Please try again!",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 relative overflow-hidden">
      {/* Pixelated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-16 left-20 w-8 h-8 bg-yellow-400 animate-bounce" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}></div>
        <div className="absolute top-32 right-16 w-6 h-6 bg-red-400 rounded-sm animate-pulse"></div>
        <div className="absolute bottom-40 left-1/4 w-10 h-10 bg-green-400 animate-ping" style={{ clipPath: 'polygon(20% 0%, 0% 20%, 30% 50%, 0% 80%, 20% 100%, 50% 70%, 80% 100%, 100% 80%, 70% 50%, 100% 20%, 80% 0%, 50% 30%)' }}></div>
        
        {/* Pixelated grid overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}></div>
      </div>

      {/* Navbar */}
      <nav className="bg-black/80 backdrop-blur-sm border-b-4 border-yellow-400 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Gamepad2 className="h-8 w-8 text-yellow-400" />
            <h1 className="text-2xl font-bold text-white pixelated" style={{ textShadow: '2px 2px 0px #000' }}>
              RETRO ARCADE
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-yellow-400 text-black font-bold border-2 border-black">
              HIGH SCORE
            </Badge>
            <Badge className="bg-red-400 text-white font-bold border-2 border-black">
              1UP
            </Badge>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Hero Section */}
          <div className="flex flex-col justify-center space-y-6">
            <div className="space-y-4">
              <Badge className="bg-yellow-400 text-black font-bold border-2 border-black text-lg px-4 py-2">
                🕹️ CLASSIC GAMING ZONE
              </Badge>
              <h2 className="text-5xl font-bold text-white leading-tight" style={{ textShadow: '3px 3px 0px #000' }}>
                INSERT COIN
                <span className="block text-yellow-400">
                  TO CONTINUE
                </span>
              </h2>
              <p className="text-xl text-white leading-relaxed" style={{ textShadow: '1px 1px 0px #000' }}>
                Support your favorite retro gamer! Every coin helps unlock new levels 
                and keeps the arcade spirit alive. 🎮
              </p>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-400" />
                <span className="text-white font-bold">8-BIT EFFECTS</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-red-400" />
                <span className="text-white font-bold">RETRO VIBES</span>
              </div>
            </div>
          </div>

          {/* Donation Form */}
          <Card className="bg-black/90 backdrop-blur-sm border-4 border-yellow-400 shadow-2xl shadow-yellow-400/50">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 border-b-4 border-yellow-400">
              <CardTitle className="text-2xl font-bold text-white flex items-center space-x-2">
                <Gamepad2 className="h-6 w-6 text-yellow-400" />
                <span>PLAYER SELECT</span>
              </CardTitle>
              <CardDescription className="text-yellow-200 font-bold">
                Choose your power-up and insert coin!
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-yellow-400">PLAYER NAME</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter 3 characters like old arcades"
                    className="bg-purple-900/50 border-2 border-yellow-400 text-white placeholder-yellow-200 font-mono text-lg"
                    maxLength={20}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-yellow-400">COINS (₹)</label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="25"
                    min="1"
                    className="bg-purple-900/50 border-2 border-yellow-400 text-white placeholder-yellow-200 font-mono text-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-yellow-400">SELECT POWER-UP</label>
                  <Select value={powerupType} onValueChange={setPowerupType}>
                    <SelectTrigger className="bg-purple-900/50 border-2 border-yellow-400 text-white font-mono">
                      <SelectValue placeholder="Choose your power-up" />
                    </SelectTrigger>
                    <SelectContent className="bg-purple-900 border-2 border-yellow-400">
                      {powerups.map((powerup) => (
                        <SelectItem key={powerup.value} value={powerup.value} className="text-white font-mono">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{powerup.label}</span>
                            <span className="text-sm text-yellow-200">- {powerup.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-yellow-400">ANIMATION STYLE</label>
                  <Select value={pixelAnimation} onValueChange={setPixelAnimation}>
                    <SelectTrigger className="bg-purple-900/50 border-2 border-yellow-400 text-white font-mono">
                      <SelectValue placeholder="Choose animation" />
                    </SelectTrigger>
                    <SelectContent className="bg-purple-900 border-2 border-yellow-400">
                      {animations.map((anim) => (
                        <SelectItem key={anim.value} value={anim.value} className="text-white font-mono">
                          {anim.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-yellow-400">MESSAGE</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your retro message here!"
                    className="bg-purple-900/50 border-2 border-yellow-400 text-white placeholder-yellow-200 font-mono min-h-20"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeSound"
                    checked={includeSound}
                    onCheckedChange={setIncludeSound}
                    className="border-2 border-yellow-400 data-[state=checked]:bg-yellow-400 data-[state=checked]:text-black"
                  />
                  <label htmlFor="includeSound" className="text-sm text-white font-bold flex items-center space-x-2">
                    {includeSound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    <span>8-BIT SOUND FX</span>
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-black font-bold py-4 text-lg border-4 border-black transition-all duration-300 transform hover:scale-105"
                  style={{ textShadow: '1px 1px 0px #fff' }}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                      <span>INSERTING COIN...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Trophy className="h-5 w-5" />
                      <span>🪙 INSERT COIN 🪙</span>
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* High Score Board */}
        <div className="mt-12">
          <Card className="bg-black/90 border-4 border-yellow-400">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 border-b-4 border-yellow-400">
              <CardTitle className="text-2xl font-bold text-white text-center">
                🏆 HIGH SCORES 🏆
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-4 gap-4 text-center">
                <div className="bg-purple-900/50 border-2 border-yellow-400 p-4 rounded">
                  <div className="text-yellow-400 font-bold text-lg">🪙 COIN</div>
                  <div className="text-white font-mono">₹1 - ₹49</div>
                  <div className="text-yellow-200 text-sm">Classic arcade fun</div>
                </div>
                <div className="bg-purple-900/50 border-2 border-yellow-400 p-4 rounded">
                  <div className="text-yellow-400 font-bold text-lg">⭐ STAR</div>
                  <div className="text-white font-mono">₹50 - ₹99</div>
                  <div className="text-yellow-200 text-sm">Star power activated</div>
                </div>
                <div className="bg-purple-900/50 border-2 border-yellow-400 p-4 rounded">
                  <div className="text-yellow-400 font-bold text-lg">🍄 MUSHROOM</div>
                  <div className="text-white font-mono">₹100 - ₹199</div>
                  <div className="text-yellow-200 text-sm">Power-up mode</div>
                </div>
                <div className="bg-purple-900/50 border-2 border-yellow-400 p-4 rounded">
                  <div className="text-yellow-400 font-bold text-lg">❤️ HEART</div>
                  <div className="text-white font-mono">₹200+</div>
                  <div className="text-yellow-200 text-sm">Extra life granted</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RetroArcade;
