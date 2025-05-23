
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { getDashboardStats } from "@/utils/dashboardUtils";
import { Heart, Users, DollarSign, MessageSquare, FileText, LogOut, Eye, Sparkles } from "lucide-react";

const ChiaGamingDashboard = () => {
  useAuthProtection("chia_gaming");
  
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalAmount: "0",
    totalDonors: 0,
    recentDonations: [] as any[]
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const dashboardStats = await getDashboardStats("chia_gaming_donations");
      setStats(dashboardStats);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("chiaGamingAuth");
    navigate("/chia_gaming/login");
  };

  const copyObsUrl = (obsId: string) => {
    const url = `${window.location.origin}/chia_gaming/obs/${obsId}`;
    navigator.clipboard.writeText(url);
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Heart className="h-10 w-10 text-pink-500" />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                Chia Gaming Dashboard
              </h1>
              <p className="text-pink-600">Welcome back, beautiful! 💕</p>
            </div>
            <Sparkles className="h-10 w-10 text-purple-500" />
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
          <Card className="bg-white/70 backdrop-blur-sm border-2 border-pink-200/50 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center text-pink-900">
                <Heart className="h-5 w-5 mr-2 text-pink-500" />
                Total Love
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-pink-700">₹{stats.totalAmount}</div>
              <p className="text-sm text-pink-600">{stats.totalDonations} donations received</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-2 border-pink-200/50 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center text-pink-900">
                <Users className="h-5 w-5 mr-2 text-pink-500" />
                Supporters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-pink-700">{stats.totalDonors}</div>
              <p className="text-sm text-pink-600">Amazing people supporting you</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-2 border-pink-200/50 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center text-pink-900">
                <MessageSquare className="h-5 w-5 mr-2 text-pink-500" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-pink-700">{stats.totalDonations}</div>
              <p className="text-sm text-pink-600">Love messages received</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white/70 backdrop-blur-sm border-2 border-pink-200/50">
            <CardHeader>
              <CardTitle className="text-pink-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => navigate("/chia_gaming/messages")}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                View Love Messages
              </Button>
              
              <Button 
                onClick={() => navigate("/chia_gaming/export")}
                variant="outline"
                className="w-full border-pink-300 text-pink-700 hover:bg-pink-50"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              
              <Button 
                onClick={() => copyObsUrl("1")}
                variant="outline"
                className="w-full border-pink-300 text-pink-700 hover:bg-pink-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                Copy OBS URL
              </Button>
            </CardContent>
          </Card>

          {/* Recent Donations */}
          <Card className="bg-white/70 backdrop-blur-sm border-2 border-pink-200/50">
            <CardHeader>
              <CardTitle className="text-pink-900">Recent Love 💕</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentDonations.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-pink-300 mx-auto mb-2" />
                  <p className="text-pink-600">No donations yet</p>
                  <p className="text-sm text-pink-500">Share your page to start receiving love!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {stats.recentDonations.map((donation) => (
                    <div key={donation.id} className="flex items-center justify-between p-3 bg-pink-50/50 rounded-lg border border-pink-200/30">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                          <Heart className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-pink-900">{donation.name}</p>
                          <p className="text-sm text-pink-600 truncate max-w-48">
                            {donation.message}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                        ₹{donation.amount}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Donation URL */}
        <Card className="bg-white/70 backdrop-blur-sm border-2 border-pink-200/50">
          <CardHeader>
            <CardTitle className="text-pink-900">Your Donation Page</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <code className="flex-1 p-3 bg-pink-50/50 rounded-lg border border-pink-200/30 text-pink-800">
                {window.location.origin}/chia_gaming
              </code>
              <Button 
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/chia_gaming`)}
                variant="outline"
                className="border-pink-300 text-pink-700 hover:bg-pink-50"
              >
                Copy Link
              </Button>
            </div>
            <p className="text-sm text-pink-600 mt-2">
              Share this link with your audience to start receiving donations! 💖
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChiaGamingDashboard;
