
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSecureAuthProtection } from "@/hooks/useSecureAuthProtection";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { logSecurityEvent } from "@/services/secureAuth";
import { 
  Users, 
  DollarSign, 
  MessageSquare, 
  TrendingUp, 
  Calendar,
  Shield,
  Activity
} from "lucide-react";

interface DashboardStats {
  totalDonations: number;
  totalAmount: number;
  todayDonations: number;
  todayAmount: number;
  averageDonation: number;
}

const ChiaaGamingDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalDonations: 0,
    totalAmount: 0,
    todayDonations: 0,
    todayAmount: 0,
    averageDonation: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use secure auth protection
  const { isAuthenticated, adminType } = useSecureAuthProtection({
    redirectTo: "/chiaa_gaming/login",
    requiredAdminType: "chiaa_gaming"
  });
  
  const { signOut } = useSecureAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Log dashboard access
      await logSecurityEvent('ACCESS_DASHBOARD', { table: 'chiaa_gaming_donations' });
      
      // Get today's date for filtering
      const today = new Date();
      const todayStart = `${today.toISOString().split('T')[0]}T00:00:00`;
      const todayEnd = `${today.toISOString().split('T')[0]}T23:59:59`;

      // Fetch all successful donations
      const { data: allDonations, error: allError } = await supabase
        .from("chiaa_gaming_donations")
        .select("amount, created_at")
        .eq("payment_status", "success");

      if (allError) throw allError;

      // Fetch today's donations
      const { data: todayDonations, error: todayError } = await supabase
        .from("chiaa_gaming_donations")
        .select("amount")
        .eq("payment_status", "success")
        .gte("created_at", todayStart)
        .lte("created_at", todayEnd);

      if (todayError) throw todayError;

      // Calculate statistics
      const totalAmount = allDonations?.reduce((sum, donation) => sum + Number(donation.amount), 0) || 0;
      const todayAmount = todayDonations?.reduce((sum, donation) => sum + Number(donation.amount), 0) || 0;
      const totalCount = allDonations?.length || 0;
      const todayCount = todayDonations?.length || 0;
      const averageDonation = totalCount > 0 ? totalAmount / totalCount : 0;

      setStats({
        totalDonations: totalCount,
        totalAmount,
        todayDonations: todayCount,
        todayAmount,
        averageDonation,
      });

      console.log("Dashboard data loaded successfully");
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        variant: "destructive",
        title: "Failed to load dashboard",
        description: "Could not retrieve donation statistics",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/chiaa_gaming/login");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-black flex items-center justify-center">
        <div className="text-pink-100 text-center">
          <Shield className="mx-auto h-12 w-12 mb-4" />
          <h1 className="text-2xl font-bold mb-4">Authenticating...</h1>
          <p>Please wait while we verify your secure credentials.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-black">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-pink-100">Secure Gaming Dashboard</h1>
            <div className="flex items-center mt-2 space-x-2">
              <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/50">
                <Shield className="w-3 h-3 mr-1" />
                Authenticated: {adminType}
              </Badge>
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/50">
                <Activity className="w-3 h-3 mr-1" />
                Secure Session
              </Badge>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="border-pink-500/50 text-pink-100 hover:bg-pink-500/20"
          >
            Secure Logout
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-black/50 border-pink-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-pink-200">Total Donations</CardTitle>
              <Users className="h-4 w-4 text-pink-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-100">
                {isLoading ? "..." : stats.totalDonations.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/50 border-pink-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-pink-200">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-pink-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-100">
                {isLoading ? "..." : `₹${stats.totalAmount.toLocaleString()}`}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/50 border-pink-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-pink-200">Today's Donations</CardTitle>
              <Calendar className="h-4 w-4 text-pink-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-100">
                {isLoading ? "..." : stats.todayDonations.toLocaleString()}
              </div>
              <p className="text-xs text-pink-300 mt-1">
                ₹{stats.todayAmount.toLocaleString()} today
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/50 border-pink-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-pink-200">Average Donation</CardTitle>
              <TrendingUp className="h-4 w-4 text-pink-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-100">
                {isLoading ? "..." : `₹${Math.round(stats.averageDonation).toLocaleString()}`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-black/50 border-pink-500/30">
            <CardHeader>
              <CardTitle className="text-pink-100">Secure Donation Management</CardTitle>
              <CardDescription className="text-pink-300">
                Manage your donations with secure, audited access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => navigate("/chiaa_gaming/messages")}
                className="w-full bg-pink-600 hover:bg-pink-700"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Secure Donation Messages
              </Button>
              <div className="text-xs text-pink-300/70 flex items-center">
                <Shield className="w-3 h-3 mr-1" />
                Protected by RLS policies and audit logging
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/50 border-pink-500/30">
            <CardHeader>
              <CardTitle className="text-pink-100">Security Features</CardTitle>
              <CardDescription className="text-pink-300">
                Enhanced security and monitoring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center text-sm text-pink-200">
                <Shield className="w-4 h-4 mr-2 text-green-400" />
                Row Level Security Enabled
              </div>
              <div className="flex items-center text-sm text-pink-200">
                <Activity className="w-4 h-4 mr-2 text-blue-400" />
                Audit Logging Active
              </div>
              <div className="flex items-center text-sm text-pink-200">
                <Users className="w-4 h-4 mr-2 text-purple-400" />
                Token-based OBS Access
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChiaaGamingDashboard;
