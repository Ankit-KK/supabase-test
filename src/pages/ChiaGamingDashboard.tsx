
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { Heart, Users, DollarSign, MessageSquare, Download, Eye, LogOut, Sparkles } from "lucide-react";

const ChiaGamingDashboard = () => {
  useAuthProtection("chia_gaming");
  
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalAmount: 0,
    recentDonations: [] as any[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch donation statistics
      const { data: donations, error } = await supabase
        .from("chia_gaming_donations")
        .select("*")
        .eq("payment_status", "paid")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const totalAmount = donations?.reduce((sum, donation) => sum + parseFloat(donation.amount), 0) || 0;
      const recentDonations = donations?.slice(0, 5) || [];

      setStats({
        totalDonations: donations?.length || 0,
        totalAmount,
        recentDonations,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("chia_gaming_auth");
    toast({
      title: "Logged out successfully! 👋",
      description: "See you soon, beautiful!",
    });
    navigate("/chia_gaming/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-6"
      style={{
        background: `
          radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(219, 39, 119, 0.3) 0%, transparent 50%),
          linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #fdf2f8 100%)
        `
      }}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Heart className="h-8 w-8 text-pink-500" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              Chia Gaming Dashboard
            </h1>
            <Sparkles className="h-8 w-8 text-purple-500" />
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-pink-300 text-pink-700 hover:bg-pink-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/70 backdrop-blur-sm border-2 border-pink-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-pink-700">Total Supporters</CardTitle>
              <Users className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-900">{stats.totalDonations}</div>
              <p className="text-xs text-pink-600">Amazing supporters! 💖</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-2 border-pink-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-pink-700">Total Love Received</CardTitle>
              <DollarSign className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-900">₹{stats.totalAmount.toFixed(2)}</div>
              <p className="text-xs text-pink-600">So much love! ✨</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-2 border-pink-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-pink-700">Average Support</CardTitle>
              <Heart className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-900">
                ₹{stats.totalDonations > 0 ? (stats.totalAmount / stats.totalDonations).toFixed(2) : "0.00"}
              </div>
              <p className="text-xs text-pink-600">Per supporter 💕</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            onClick={() => navigate("/chia_gaming/messages")}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white h-12"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            View Messages
          </Button>

          <Button
            onClick={() => navigate("/chia_gaming/export")}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white h-12"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>

          <Button
            onClick={() => navigate("/chia_gaming/obs/1")}
            className="bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white h-12"
          >
            <Eye className="h-4 w-4 mr-2" />
            OBS View
          </Button>

          <Button
            onClick={() => navigate("/chia_gaming")}
            variant="outline"
            className="border-pink-300 text-pink-700 hover:bg-pink-50 h-12"
          >
            <Heart className="h-4 w-4 mr-2" />
            Donation Page
          </Button>
        </div>

        {/* Recent Donations */}
        <Card className="bg-white/70 backdrop-blur-sm border-2 border-pink-200/50">
          <CardHeader>
            <CardTitle className="text-pink-700 flex items-center">
              <Heart className="h-5 w-5 mr-2" />
              Recent Love & Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentDonations.length === 0 ? (
              <p className="text-pink-600 text-center py-8">No donations yet. Share your page to start receiving love! 💖</p>
            ) : (
              <div className="space-y-4">
                {stats.recentDonations.map((donation) => (
                  <div
                    key={donation.id}
                    className="flex justify-between items-start p-4 bg-pink-50/50 rounded-lg border border-pink-200/30"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-pink-900">{donation.name}</span>
                        <span className="text-pink-600">donated ₹{donation.amount}</span>
                      </div>
                      <p className="text-pink-700 mt-1">{donation.message}</p>
                      <p className="text-xs text-pink-500 mt-2">
                        {new Date(donation.created_at).toLocaleString()}
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

export default ChiaGamingDashboard;
