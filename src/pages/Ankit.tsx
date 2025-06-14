
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { isStreamerOnline } from "@/services/streamerAuth";

const Ankit = () => {
  const { streamerId } = useParams();
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if streamer is online
    const checkStreamerStatus = async () => {
      const online = await isStreamerOnline("ankit");
      setIsOnline(online);
    };

    checkStreamerStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkStreamerStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "Streamer Offline",
        description: "The streamer is currently offline. Please try again later.",
      });
      return;
    }

    if (!formData.name.trim() || !formData.amount.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in both name and amount fields.",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0.",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Store donation in database
      const { data, error } = await supabase
        .from("ankit_donations")
        .insert({
          name: formData.name.trim(),
          amount: amount,
          message: formData.message.trim(),
          payment_status: "pending",
          order_id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Donation Submitted",
        description: "Thank you for your support! Processing payment...",
      });

      // Reset form
      setFormData({
        name: "",
        amount: "",
        message: "",
      });

    } catch (error: any) {
      console.error("Error submitting donation:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "There was an error submitting your donation. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isOnline === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Checking streamer status...</div>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-white rounded-full"></div>
            </div>
            <CardTitle className="text-2xl text-white">Streamer Offline</CardTitle>
            <CardDescription className="text-gray-300">
              Ankit is currently offline. Donations are not available at this time.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-400 text-sm">
              Please check back later when the stream is live!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          </div>
          <CardTitle className="text-2xl text-white">Support Ankit</CardTitle>
          <CardDescription className="text-gray-200">
            Send a donation to show your support
          </CardDescription>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm font-medium">LIVE</span>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Your Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your name"
                required
                className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-white">Amount (₹)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="1"
                step="0.01"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Enter amount"
                required
                className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-white">Message (Optional)</Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Leave a message..."
                rows={3}
                className="bg-white/20 border-white/30 text-white placeholder:text-gray-300 resize-none"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Send Donation"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Ankit;
