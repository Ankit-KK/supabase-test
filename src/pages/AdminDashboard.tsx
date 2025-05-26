
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { 
  DollarSign, 
  TrendingUp,
  Download
} from "lucide-react";
import StreamerTotalsTab from "@/components/admin/StreamerTotalsTab";
import WeeklyPayoutsTab from "@/components/admin/WeeklyPayoutsTab";

const AdminDashboard = () => {
  const { isAdminAuthenticated } = useAdminAuth();
  const [activeTab, setActiveTab] = useState("totals");

  const tabs = [
    { id: "totals", label: "Streamer Totals", icon: TrendingUp },
    { id: "payouts", label: "Weekly Payouts", icon: DollarSign }
  ];

  if (!isAdminAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">HyperChat Admin Dashboard</h1>
            <p className="text-slate-600 mt-1">Simple donation and payout management</p>
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
          {activeTab === "totals" && <StreamerTotalsTab />}
          {activeTab === "payouts" && <WeeklyPayoutsTab />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
