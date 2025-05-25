import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { 
  DollarSign, 
  Users, 
  Clock, 
  AlertTriangle,
  Download,
  FileText,
  TrendingUp,
  Calendar
} from "lucide-react";
import DashboardMetrics from "@/components/admin/DashboardMetrics";
import StreamerDonationsTable from "@/components/admin/StreamerDonationsTable";
import WeeklyPayoutSummary from "@/components/admin/WeeklyPayoutSummary";
import PayoutActionsPanel from "@/components/admin/PayoutActionsPanel";
import PayoutMethodManagement from "@/components/admin/PayoutMethodManagement";
import AlertsPanel from "@/components/admin/AlertsPanel";
import PayoutHistory from "@/components/admin/PayoutHistory";
import AuditLog from "@/components/admin/AuditLog";

interface DashboardData {
  totalDonationsThisWeek: number;
  totalAmountToBePaid: number;
  pendingPayouts: number;
  lastPayoutProcessed: string;
}

const AdminDashboard = () => {
  // Protect admin route
  const { isAdminAuthenticated } = useAdminAuth();
  
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalDonationsThisWeek: 0,
    totalAmountToBePaid: 0,
    pendingPayouts: 0,
    lastPayoutProcessed: "Never"
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchDashboardData();
    }
  }, [isAdminAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      // Get current week start (Saturday) and end (Friday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysUntilSaturday = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - daysUntilSaturday);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      let totalWeeklyDonations = 0;
      let totalAmount = 0;

      // Fetch from ankit_donations
      const { data: ankitData, error: ankitError } = await supabase
        .from('ankit_donations')
        .select('amount, created_at')
        .eq('payment_status', 'completed')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString());

      if (!ankitError && ankitData) {
        totalWeeklyDonations += ankitData.length;
        totalAmount += ankitData.reduce((sum, donation) => sum + Number(donation.amount), 0);
      }

      // Fetch from harish_donations
      const { data: harishData, error: harishError } = await supabase
        .from('harish_donations')
        .select('amount, created_at')
        .eq('payment_status', 'completed')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString());

      if (!harishError && harishData) {
        totalWeeklyDonations += harishData.length;
        totalAmount += harishData.reduce((sum, donation) => sum + Number(donation.amount), 0);
      }

      // Fetch from mackle_donations
      const { data: mackleData, error: mackleError } = await supabase
        .from('mackle_donations')
        .select('amount, created_at')
        .eq('payment_status', 'completed')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString());

      if (!mackleError && mackleData) {
        totalWeeklyDonations += mackleData.length;
        totalAmount += mackleData.reduce((sum, donation) => sum + Number(donation.amount), 0);
      }

      // Fetch from rakazone_donations
      const { data: rakazoneData, error: rakazoneError } = await supabase
        .from('rakazone_donations')
        .select('amount, created_at')
        .eq('payment_status', 'completed')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString());

      if (!rakazoneError && rakazoneData) {
        totalWeeklyDonations += rakazoneData.length;
        totalAmount += rakazoneData.reduce((sum, donation) => sum + Number(donation.amount), 0);
      }

      setDashboardData({
        totalDonationsThisWeek: totalWeeklyDonations,
        totalAmountToBePaid: totalAmount * 0.7, // Assuming 70% payout rate
        pendingPayouts: 12, // This would be calculated based on actual payout records
        lastPayoutProcessed: "2024-01-15"
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "donations", label: "Donations", icon: DollarSign },
    { id: "payouts", label: "Weekly Payouts", icon: Calendar },
    { id: "methods", label: "Payout Methods", icon: Users },
    { id: "history", label: "History", icon: FileText },
    { id: "audit", label: "Audit Log", icon: Clock }
  ];

  // Don't render anything if not authenticated (useAdminAuth will redirect)
  if (!isAdminAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">HyperChat Admin Dashboard</h1>
            <p className="text-slate-600 mt-1">Manage donation payouts across all streamers</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export Data</span>
            </Button>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Last Updated: {new Date().toLocaleTimeString()}
            </Badge>
          </div>
        </div>

        {/* Dashboard Metrics */}
        <DashboardMetrics data={dashboardData} />

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 bg-white rounded-lg p-1 shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-blue-500 text-white shadow-md"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <StreamerDonationsTable />
              </div>
              <div className="space-y-6">
                <AlertsPanel />
                <PayoutActionsPanel />
              </div>
            </div>
          )}

          {activeTab === "donations" && <StreamerDonationsTable />}
          {activeTab === "payouts" && <WeeklyPayoutSummary />}
          {activeTab === "methods" && <PayoutMethodManagement />}
          {activeTab === "history" && <PayoutHistory />}
          {activeTab === "audit" && <AuditLog />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
