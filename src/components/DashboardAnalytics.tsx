
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/dashboardUtils";
import { TrendingUp, Users, DollarSign, Calendar } from "lucide-react";

interface DashboardAnalyticsProps {
  donations: any[];
  monthlyTotal: number;
}

const DashboardAnalytics = ({ donations, monthlyTotal }: DashboardAnalyticsProps) => {
  const todaysDonations = donations.filter(d => {
    const today = new Date().toDateString();
    return new Date(d.created_at).toDateString() === today;
  });

  const todaysTotal = todaysDonations.reduce((sum, d) => sum + Number(d.amount), 0);
  const uniqueDonors = new Set(donations.map(d => d.name)).size;
  const avgDonation = donations.length > 0 ? monthlyTotal / donations.length : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-black/50 border-pink-500/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-pink-200">Today's Total</CardTitle>
          <DollarSign className="h-4 w-4 text-pink-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-pink-100">{formatCurrency(todaysTotal)}</div>
          <p className="text-xs text-pink-300">
            {todaysDonations.length} donation{todaysDonations.length !== 1 ? 's' : ''} today
          </p>
        </CardContent>
      </Card>

      <Card className="bg-black/50 border-pink-500/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-pink-200">Monthly Total</CardTitle>
          <TrendingUp className="h-4 w-4 text-pink-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-pink-100">{formatCurrency(monthlyTotal)}</div>
          <p className="text-xs text-pink-300">
            {donations.length} donation{donations.length !== 1 ? 's' : ''} this month
          </p>
        </CardContent>
      </Card>

      <Card className="bg-black/50 border-pink-500/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-pink-200">Unique Donors</CardTitle>
          <Users className="h-4 w-4 text-pink-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-pink-100">{uniqueDonors}</div>
          <p className="text-xs text-pink-300">
            Different supporters
          </p>
        </CardContent>
      </Card>

      <Card className="bg-black/50 border-pink-500/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-pink-200">Average Donation</CardTitle>
          <Calendar className="h-4 w-4 text-pink-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-pink-100">{formatCurrency(avgDonation)}</div>
          <p className="text-xs text-pink-300">
            Per donation
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardAnalytics;
