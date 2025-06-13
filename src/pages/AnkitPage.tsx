
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Gift, Star, Settings } from "lucide-react";

const AnkitPage = () => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !amount || !message) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all fields",
      });
      return;
    }

    const donationAmount = parseFloat(amount);
    if (isNaN(donationAmount) || donationAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter a valid donation amount",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create donation record
      const { data, error } = await supabase
        .from("ankit_donations")
        .insert({
          name,
          amount: donationAmount,
          message,
          payment_status: "pending"
        })
        .select()
        .single();

      if (error) throw error;

      // Redirect to payment checkout
      navigate("/payment-checkout", {
        state: {
          donationId: data.id,
          amount: donationAmount,
          streamerName: "ankit",
          donorName: name,
          message
        }
      });

    } catch (error) {
      console.error("Donation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process donation. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Heart className="h-8 w-8 text-red-500" />
            <h1 className="text-4xl font-bold text-gray-900">Support Ankit</h1>
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
          <p className="text-lg text-gray-600">
            Show your support with a donation
          </p>
        </div>

        {/* Main donation card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2 text-2xl">
              <Gift className="h-6 w-6 text-purple-600" />
              <span>Make a Donation</span>
            </CardTitle>
            <CardDescription>
              Your support means everything! Every contribution helps.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDonation} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Donation Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="1"
                  required
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Your Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write a supportive message..."
                  required
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 min-h-[100px]"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Heart className="h-5 w-5" />
                    <span>Donate ₹{amount || "0"}</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Admin login link */}
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/ankit/login")}
            className="text-gray-500 hover:text-gray-700"
          >
            <Settings className="mr-2 h-4 w-4" />
            Admin Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AnkitPage;
