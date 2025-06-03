
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Cpu, DollarSign, Users, TrendingUp, Download, Eye, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, calculateMonthlyTotal } from "@/utils/dashboardUtils";
import DonationExport from "@/components/DonationExport";
import { toast } from "@/hooks/use-toast";

const CyberStrikerDashboard = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: donations = [], isLoading, refetch } = useQuery({
    queryKey: ["cyber-striker-donations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cyber_striker_donations")
        .select("*")
        .eq("payment_status", "success")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast({
      title: "Data refreshed",
      description: "Dashboard data has been updated",
    });
  };

  const totalAmount = donations.reduce((sum, donation) => sum + Number(donation.amount), 0);
  const monthlyTotal = calculateMonthlyTotal(donations);
  const recentDonations = donations.slice(0, 10);

  const tierStats = donations.reduce((acc, donation) => {
    const tier = donation.donation_tier || 'basic';
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Cpu className="h-8 w-8 text-cyan-400" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Cyber Striker Dashboard
              </h1>
              <p className="text-gray-400">Neural link analytics & donation management</p>
            </div>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-black/40 border-cyan-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cyan-400">Total Donations</CardTitle>
              <DollarSign className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(totalAmount)}</div>
              <p className="text-xs text-gray-400">All time earnings</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-purple-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-400">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(monthlyTotal)}</div>
              <p className="text-xs text-gray-400">Current month</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-cyan-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cyan-400">Total Donors</CardTitle>
              <Users className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{donations.length}</div>
              <p className="text-xs text-gray-400">Unique contributions</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-purple-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-400">Avg Donation</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(donations.length > 0 ? totalAmount / donations.length : 0)}
              </div>
              <p className="text-xs text-gray-400">Per transaction</p>
            </CardContent>
          </Card>
        </div>

        {/* Tier Statistics */}
        <Card className="bg-black/40 border-cyan-400/30 mb-8">
          <CardHeader>
            <CardTitle className="text-cyan-400">Donation Tier Statistics</CardTitle>
            <CardDescription className="text-gray-400">Neural link tier distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-cyan-400/10 rounded-lg border border-cyan-400/30">
                <div className="text-2xl font-bold text-cyan-400">{tierStats.basic || 0}</div>
                <div className="text-sm text-gray-400">Basic Tier</div>
              </div>
              <div className="text-center p-4 bg-purple-400/10 rounded-lg border border-purple-400/30">
                <div className="text-2xl font-bold text-purple-400">{tierStats.premium || 0}</div>
                <div className="text-sm text-gray-400">Premium Tier</div>
              </div>
              <div className="text-center p-4 bg-yellow-400/10 rounded-lg border border-yellow-400/30">
                <div className="text-2xl font-bold text-yellow-400">{tierStats.legendary || 0}</div>
                <div className="text-sm text-gray-400">Legendary Tier</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Donations */}
          <Card className="bg-black/40 border-cyan-400/30">
            <CardHeader>
              <CardTitle className="text-cyan-400">Recent Neural Transfers</CardTitle>
              <CardDescription className="text-gray-400">Latest donation activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="text-center text-gray-400">Loading neural data...</div>
                ) : recentDonations.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-cyan-400/30">
                        <TableHead className="text-cyan-400">Operative</TableHead>
                        <TableHead className="text-cyan-400">Amount</TableHead>
                        <TableHead className="text-cyan-400">Tier</TableHead>
                        <TableHead className="text-cyan-400">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentDonations.map((donation) => (
                        <TableRow key={donation.id} className="border-cyan-400/20">
                          <TableCell className="text-white font-mono">{donation.name}</TableCell>
                          <TableCell className="text-cyan-400 font-bold">
                            {formatCurrency(Number(donation.amount))}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={`${
                                donation.donation_tier === 'legendary' 
                                  ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400' 
                                  : donation.donation_tier === 'premium'
                                  ? 'bg-purple-400/20 text-purple-400 border-purple-400'
                                  : 'bg-cyan-400/20 text-cyan-400 border-cyan-400'
                              }`}
                              variant="outline"
                            >
                              {(donation.donation_tier || 'basic').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400 font-mono">
                            {new Date(donation.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center text-gray-400">No neural transfers recorded</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export Section */}
          <div className="space-y-6">
            <DonationExport 
              tableName="cyber_striker_donations" 
              streamerName="CyberStriker"
            />
            
            <Card className="bg-black/40 border-purple-400/30">
              <CardHeader>
                <CardTitle className="text-purple-400">Quick Actions</CardTitle>
                <CardDescription className="text-gray-400">Dashboard management tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                  onClick={() => window.open('/cyber-striker', '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Donation Page
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CyberStrikerDashboard;
