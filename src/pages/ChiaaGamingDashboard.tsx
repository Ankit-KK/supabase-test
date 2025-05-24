
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { isStreamerAuthenticated, logoutStreamer } from "@/services/streamerAuth";
import { formatDistanceToNow } from "date-fns";
import { 
  Heart, 
  TrendingUp, 
  Users, 
  DollarSign, 
  MessageSquare, 
  Eye, 
  Download,
  LogOut,
  Gamepad2,
  Sparkles,
  Music
} from "lucide-react";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  include_sound: boolean;
  created_at: string;
  payment_status: string;
}

const ChiaaGamingDashboard = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalDonations: 0,
    todayAmount: 0,
    todayDonations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isStreamerAuthenticated("chiaa_gaming")) {
      navigate("/chiaa-gaming/login");
      return;
    }
    
    fetchDonations();
    calculateStats();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('chiaa_gaming_donations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chiaa_gaming_donations'
        },
        (payload) => {
          console.log('Real-time update:', payload);
          fetchDonations();
          calculateStats();
          
          if (payload.eventType === 'INSERT') {
            const newDonation = payload.new as Donation;
            toast({
              title: "New Donation! 💖",
              description: `₹${newDonation.amount} from ${newDonation.name}`,
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
      console.log('Fetching donations for dashboard...');
      const { data, error } = await supabase
        .from("chiaa_gaming_donations")
        .select("*")
        .in("payment_status", ["completed", "success"])
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching donations:", error);
        throw error;
      }
      
      console.log('Dashboard donations fetched:', data);
      setDonations(data || []);
    } catch (error) {
      console.error("Error fetching donations:", error);
      toast({
        title: "Error",
        description: "Failed to fetch donations",
        variant: "destructive",
      });
    }
  };

  const calculateStats = async () => {
    try {
      console.log('Calculating stats...');
      const { data, error } = await supabase
        .from("chiaa_gaming_donations")
        .select("amount, created_at")
        .in("payment_status", ["completed", "success"]);

      if (error) {
        console.error("Error calculating stats:", error);
        throw error;
      }

      console.log('Stats data fetched:', data);

      const today = new Date().toDateString();
      let totalAmount = 0;
      let todayAmount = 0;
      let todayCount = 0;

      data?.forEach((donation) => {
        const amount = Number(donation.amount);
        totalAmount += amount;
        
        const donationDate = new Date(donation.created_at).toDateString();
        if (donationDate === today) {
          todayAmount += amount;
          todayCount++;
        }
      });

      const newStats = {
        totalAmount,
        totalDonations: data?.length || 0,
        todayAmount,
        todayDonations: todayCount,
      };

      console.log('Calculated stats:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error("Error calculating stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logoutStreamer("chiaa_gaming");
    toast({
      title: "Logged out",
      description: "See you soon! 💕",
    });
    navigate("/chiaa-gaming/login");
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
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <Heart className="h-8 w-8 text-pink-500 animate-pulse" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Chiaa Gaming Dashboard
              </h1>
              <p className="text-pink-700">Manage your donations and stream settings 💖</p>
            </div>
            <Sparkles className="h-8 w-8 text-purple-500 animate-pulse" />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => navigate("/chiaa-gaming/messages")}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
            </Button>
            <Button
              onClick={() => navigate("/chiaa-gaming/export")}
              variant="outline"
              className="border-pink-300 text-pink-600 hover:bg-pink-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => navigate("/chiaa-gaming/obs/1")}
              variant="outline"
              className="border-purple-300 text-purple-600 hover:bg-purple-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              OBS View
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-pink-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-pink-700">Total Earnings</p>
                  <p className="text-2xl font-bold text-pink-900">₹{stats.totalAmount.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Total Donations</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.totalDonations}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-pink-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-pink-700">Today's Earnings</p>
                  <p className="text-2xl font-bold text-pink-900">₹{stats.todayAmount.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Today's Count</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.todayDonations}</p>
                </div>
                <Heart className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Donations */}
        <Card className="border-pink-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-pink-800">
              <Gamepad2 className="h-5 w-5" />
              <span>Recent Donations</span>
            </CardTitle>
            <CardDescription className="text-pink-600">
              Latest support from your amazing community 💕
            </CardDescription>
          </CardHeader>
          <CardContent>
            {donations.length === 0 ? (
              <div className="text-center py-8 text-pink-600">
                <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No donations yet. Share your donation link to get started! 💖</p>
              </div>
            ) : (
              <div className="space-y-4">
                {donations.map((donation) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between p-4 border border-pink-100 rounded-lg bg-gradient-to-r from-pink-50/50 to-purple-50/50 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <p className="font-semibold text-pink-800">{donation.name}</p>
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
                      <p className="text-sm text-gray-700 mb-2">{donation.message}</p>
                      <p className="text-xs text-pink-600">
                        {formatDistanceToNow(new Date(donation.created_at), { addSuffix: true })}
                      </p>
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

export default ChiaaGamingDashboard;
