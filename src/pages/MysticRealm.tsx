
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Shield, Sword, Volume2, VolumeX, Crown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createPaymentOrder } from "@/services/paymentService";

const MysticRealm = () => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [includeSound, setIncludeSound] = useState(false);
  const [characterClass, setCharacterClass] = useState("warrior");
  const [spellEffect, setSpellEffect] = useState("sparkle");
  const [isLoading, setIsLoading] = useState(false);

  const characterClasses = [
    { value: "warrior", label: "Warrior", icon: Sword },
    { value: "mage", label: "Mage", icon: Sparkles },
    { value: "rogue", label: "Rogue", icon: Shield },
    { value: "paladin", label: "Paladin", icon: Crown },
  ];

  const spellEffects = [
    { value: "sparkle", label: "Divine Sparkles" },
    { value: "fire", label: "Flames of Power" },
    { value: "ice", label: "Frost Blessing" },
    { value: "lightning", label: "Thunder Strike" },
  ];

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
      const orderId = `mystic_realm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const numAmount = parseFloat(amount);

      const donationData = {
        name,
        amount: numAmount,
        message,
        donationType: "mystic_realm",
        include_sound: includeSound,
        character_class: characterClass,
        spell_effect: spellEffect,
        order_id: orderId,
      };
      
      sessionStorage.setItem("donationData", JSON.stringify(donationData));

      const paymentData = await createPaymentOrder(orderId, numAmount, name, "mystic_realm");
      
      if (paymentData?.payment_session_id) {
        window.location.href = `https://payments.cashfree.com/pay/${paymentData.payment_session_id}`;
      } else {
        throw new Error("Failed to create payment session");
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      toast({
        title: "Spell Failed",
        description: "The magical transaction failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      {/* Magical background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-16 w-24 h-24 bg-yellow-400/30 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-32 w-16 h-16 bg-purple-400/30 rounded-full animate-bounce"></div>
        <div className="absolute bottom-32 left-1/3 w-20 h-20 bg-pink-400/30 rounded-full animate-ping"></div>
        {/* Floating sparkles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-yellow-400 rounded-full animate-pulse`}
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Navbar */}
      <nav className="bg-black/50 backdrop-blur-sm border-b border-purple-400/30 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-yellow-400" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-purple-400 bg-clip-text text-transparent">
              MYSTIC REALM
            </h1>
          </div>
          <Badge variant="outline" className="border-yellow-400 text-yellow-400">
            MAGIC ACTIVE
          </Badge>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Hero Section */}
          <div className="flex flex-col justify-center space-y-6">
            <div className="space-y-4">
              <Badge className="bg-yellow-400/20 text-yellow-400 border-yellow-400">
                FANTASY RPG ADVENTURE
              </Badge>
              <h2 className="text-5xl font-bold text-white leading-tight">
                Cast Your
                <span className="block bg-gradient-to-r from-yellow-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Support Spell
                </span>
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                Channel your magical energy to support epic quests. 
                Every donation strengthens the realm's power.
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-yellow-400" />
                <span className="text-gray-300">Magical effects</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-purple-400" />
                <span className="text-gray-300">Fantasy themed</span>
              </div>
            </div>
          </div>

          {/* Donation Form */}
          <Card className="bg-black/40 backdrop-blur-sm border-purple-400/30 shadow-2xl shadow-purple-400/20">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-yellow-400" />
                <span>Magical Offering</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Channel your support through ancient magic
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-yellow-400">Adventurer Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your hero name"
                    className="bg-slate-800/50 border-purple-400/30 text-white placeholder-gray-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-yellow-400">Gold Amount (₹)</label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100"
                    min="1"
                    className="bg-slate-800/50 border-purple-400/30 text-white placeholder-gray-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-yellow-400">Choose Your Class</label>
                  <Select value={characterClass} onValueChange={setCharacterClass}>
                    <SelectTrigger className="bg-slate-800/50 border-purple-400/30 text-white">
                      <SelectValue placeholder="Select character class" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-purple-400/30">
                      {characterClasses.map((cls) => {
                        const IconComponent = cls.icon;
                        return (
                          <SelectItem key={cls.value} value={cls.value} className="text-white">
                            <div className="flex items-center space-x-2">
                              <IconComponent className="h-4 w-4" />
                              <span>{cls.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-yellow-400">Spell Effect</label>
                  <Select value={spellEffect} onValueChange={setSpellEffect}>
                    <SelectTrigger className="bg-slate-800/50 border-purple-400/30 text-white">
                      <SelectValue placeholder="Select spell effect" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-purple-400/30">
                      {spellEffects.map((spell) => (
                        <SelectItem key={spell.value} value={spell.value} className="text-white">
                          {spell.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-yellow-400">Magical Message</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share your magical words..."
                    className="bg-slate-800/50 border-purple-400/30 text-white placeholder-gray-500 min-h-20"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeSound"
                    checked={includeSound}
                    onCheckedChange={(checked) => setIncludeSound(checked === true)}
                    className="border-yellow-400 data-[state=checked]:bg-yellow-400"
                  />
                  <label htmlFor="includeSound" className="text-sm text-gray-300 flex items-center space-x-2">
                    {includeSound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    <span>Enable magical sounds</span>
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-yellow-500 to-purple-500 hover:from-yellow-600 hover:to-purple-600 text-white font-bold py-3 transition-all duration-300 transform hover:scale-105"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Casting Spell...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-4 w-4" />
                      <span>Cast Support Spell</span>
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MysticRealm;
