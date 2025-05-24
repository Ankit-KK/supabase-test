
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { isStreamerAuthenticated } from "@/services/streamerAuth";
import { formatDistanceToNow } from "date-fns";
import { Heart, ArrowLeft, Copy, Eye, Music, Sparkles, Gamepad2 } from "lucide-react";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  include_sound: boolean;
  created_at: string;
  payment_status: string;
}

const ChiaaGamingDonationMessages = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isStreamerAuthenticated("chiaa_gaming")) {
      navigate("/chiaa-gaming/login");
      return;
    }

    fetchDonations();

    // Set up real-time subscription
    const channel = supabase
      .channel('chiaa_gaming_messages_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chiaa_gaming_donations'
        },
        (payload) => {
          console.log('New message update:', payload);
          fetchDonations();
          
          if (payload.eventType === 'INSERT') {
            const newDonation = payload.new as Donation;
            toast({
              title: "New Donation Message! 💖",
              description: `From ${newDonation.name}: ₹${newDonation.amount}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const fetchDonations = async () => {
    try {
      console.log('Fetching all donations for messages...');
      const { data, error } = await supabase
        .from("chiaa_gaming_donations")
        .select("*")
        .in("payment_status", ["completed", "success"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching donations:", error);
        throw error;
      }
      
      console.log('Messages donations fetched:', data);
      setDonations(data || []);
    } catch (error) {
      console.error("Error fetching donations:", error);
      toast({
        title: "Error",
        description: "Failed to fetch donations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyObsUrl = () => {
    const obsUrl = `${window.location.origin}/chiaa-gaming/obs/1`;
    navigator.clipboard.writeText(obsUrl);
    toast({
      title: "Copied! 💕",
      description: "OBS overlay URL copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <Heart className="h-8 w-8 text-pink-500 animate-pulse" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Donation Messages
              </h1>
              <p className="text-pink-700">Monitor and manage your stream donations 💖</p>
            </div>
            <Sparkles className="h-8 w-8 text-purple-500 animate-pulse" />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={copyObsUrl}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy OBS URL
            </Button>
            <Button
              onClick={() => navigate("/chiaa-gaming/obs/1")}
              variant="outline"
              className="border-purple-300 text-purple-600 hover:bg-purple-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview OBS
            </Button>
            <Button
              onClick={() => navigate("/chiaa-gaming/dashboard")}
              variant="outline"
              className="border-pink-300 text-pink-600 hover:bg-pink-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>

        {/* OBS Integration Info */}
        <Card className="mb-8 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-purple-800">
              <Gamepad2 className="h-5 w-5" />
              <span>OBS Integration Setup</span>
            </CardTitle>
            <CardDescription className="text-purple-600">
              Add this URL as a Browser Source in OBS to show live donations on your stream
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white/70 p-4 rounded-lg border border-purple-200 mb-4">
              <code className="text-sm text-purple-800 break-all">
                {window.location.origin}/chiaa-gaming/obs/1
              </code>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-700">
              <div>
                <strong>Recommended Settings:</strong>
                <ul className="mt-2 space-y-1">
                  <li>• Right click source {'>'} Transform {'>'} Fit to screen</li>
                  <li>• FPS: 30</li>
                </ul>
              </div>
              <div>
                <strong>Features:</strong>
                <ul className="mt-2 space-y-1">
                  <li>• Real-time donation alerts</li>
                  <li>• Sound notifications</li>
                  <li>• Smooth animations</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages List */}
        <Card className="border-pink-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-pink-800">
              <Heart className="h-5 w-5" />
              <span>All Donation Messages</span>
            </CardTitle>
            <CardDescription className="text-pink-600">
              {donations.length} total messages from your amazing supporters 💕
            </CardDescription>
          </CardHeader>
          <CardContent>
            {donations.length === 0 ? (
              <div className="text-center py-12 text-pink-600">
                <Heart className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No donations yet!</p>
                <p className="text-sm">Share your donation link to start receiving support 💖</p>
              </div>
            ) : (
              <div className="space-y-4">
                {donations.map((donation, index) => (
                  <div
                    key={donation.id}
                    className="p-4 border border-pink-100 rounded-lg bg-gradient-to-r from-pink-50/50 to-purple-50/50 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-pink-800">{donation.name}</p>
                          <p className="text-xs text-pink-600">
                            {formatDistanceToNow(new Date(donation.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-pink-100 text-pink-700 border-pink-200">
                          ₹{donation.amount}
                        </Badge>
                        {donation.include_sound && (
                          <Badge variant="outline" className="border-purple-300 text-purple-600">
                            <Music className="h-3 w-3 mr-1" />
                            Sound
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-white/70 p-3 rounded-md border border-pink-100">
                      <p className="text-gray-700 text-sm leading-relaxed">{donation.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChiaaGamingDonationMessages;
