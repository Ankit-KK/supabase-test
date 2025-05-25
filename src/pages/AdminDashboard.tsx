
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
      let allTimeAmount = 0;

      const tables = ['ankit_donations', 'harish_donations', 'mackle_donations', 'rakazone_donations', 'chiaa_gaming_donations'];

      for (const tableName of tables) {
        // Weekly data
        const { data: weeklyData, error: weeklyError } = await supabase
          .from(tableName)
          .select('amount, created_at')
          .eq('payment_status', 'completed')
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', weekEnd.toISOString());

        if (!weeklyError && weeklyData) {
          totalWeeklyDonations += weeklyData.length;
          totalAmount += weeklyData.reduce((sum, donation) => sum + Number(donation.amount), 0);
        }

        // All time completed donations for payout calculation
        const { data: allTimeData, error: allTimeError } = await supabase
          .from(tableName)
          .select('amount')
          .eq('payment_status', 'completed');

        if (!allTimeError && allTimeData) {
          allTimeAmount += allTimeData.reduce((sum, donation) => sum + Number(donation.amount), 0);
        }
      }

      // Calculate pending payouts (70% of total completed donations)
      const totalToBePaid = allTimeAmount * 0.7;

      setDashboardData({
        totalDonationsThisWeek: totalWeeklyDonations,
        totalAmountToBePaid: totalToBePaid,
        pendingPayouts: tables.length, // Number of streamers with potential payouts
        lastPayoutProcessed: "2024-01-15" // This would come from a payouts table in real implementation
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
