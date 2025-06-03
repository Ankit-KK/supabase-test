
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Rocket, DollarSign, Users, TrendingUp, Download, Eye, RefreshCw, Satellite } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, calculateMonthlyTotal } from "@/utils/dashboardUtils";
import DonationExport from "@/components/DonationExport";
import { toast } from "@/hooks/use-toast";

const SpaceCommandDashboard = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: donations = [], isLoading, refetch } = useQuery({
    queryKey: ["space-command-donations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("space_command_donations")
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
      title: "Mission data refreshed",
      description: "Space command systems updated",
    });
  };

  const totalAmount = donations.reduce((sum, donation) => sum + Number(donation.amount), 0);
  const monthlyTotal = calculateMonthlyTotal(donations);
  const recentDonations = donations.slice(0, 10);

  const shipStats = donations.reduce((acc, donation) => {
    const ship = donation.ship_type || 'fighter';
    acc[ship] = (acc[ship] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Rocket className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Space Command Dashboard
              </h1>
              <p className="text-gray-300">Galactic mission control & fleet analytics</p>
            </div>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Systems
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-black/60 border-blue-400/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-400">Total Fuel</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(totalAmount)}</div>
              <p className="text-xs text-gray-400">Mission funding</p>
            </CardContent>
          </Card>

          <Card className="bg-black/60 border-cyan-400/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cyan-400">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(monthlyTotal)}</div>
              <p className="text-xs text-gray-400">Monthly launches</p>
            </CardContent>
          </Card>

          <Card className="bg-black/60 border-blue-400/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-400">Commanders</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{donations.length}</div>
              <p className="text-xs text-gray-400">Fleet officers</p>
            </CardContent>
          </Card>

          <Card className="bg-black/60 border-cyan-400/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cyan-400">Avg Mission</CardTitle>
              <Satellite className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(donations.length > 0 ? totalAmount / donations.length : 0)}
              </div>
              <p className="text-xs text-gray-400">Per deployment</p>
            </CardContent>
          </Card>
        </div>

        {/* Fleet Statistics */}
        <Card className="bg-black/60 border-blue-400/50 mb-8">
          <CardHeader>
            <CardTitle className="text-blue-400">Fleet Composition</CardTitle>
            <CardDescription className="text-gray-300">Spacecraft deployment stats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-400/10 rounded-lg border border-blue-400/30">
                <div className="text-2xl font-bold text-blue-400">{shipStats.fighter || 0}</div>
                <div className="text-sm text-gray-400">🚀 Fighters</div>
              </div>
              <div className="text-center p-4 bg-cyan-400/10 rounded-lg border border-cyan-400/30">
                <div className="text-2xl font-bold text-cyan-400">{shipStats.cruiser || 0}</div>
                <div className="text-sm text-gray-400">🛸 Cruisers</div>
              </div>
              <div className="text-center p-4 bg-purple-400/10 rounded-lg border border-purple-400/30">
                <div className="text-2xl font-bold text-purple-400">{shipStats.battleship || 0}</div>
                <div className="text-sm text-gray-400">🚁 Battleships</div>
              </div>
              <div className="text-center p-4 bg-green-400/10 rounded-lg border border-green-400/30">
                <div className="text-2xl font-bold text-green-400">{shipStats.explorer || 0}</div>
                <div className="text-sm text-gray-400">🛰️ Explorers</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Donations */}
          <Card className="bg-black/60 border-blue-400/50">
            <CardHeader>
              <CardTitle className="text-blue-400">Recent Mission Launches</CardTitle>
              <CardDescription className="text-gray-300">Latest space operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="text-center text-gray-300">Scanning space...</div>
                ) : recentDonations.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-blue-400/30">
                        <TableHead className="text-blue-400">Commander</TableHead>
                        <TableHead className="text-blue-400">Fuel</TableHead>
                        <TableHead className="text-blue-400">Ship</TableHead>
                        <TableHead className="text-blue-400">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentDonations.map((donation) => (
                        <TableRow key={donation.id} className="border-blue-400/20">
                          <TableCell className="text-white font-mono">{donation.name}</TableCell>
                          <TableCell className="text-blue-400 font-bold">
                            {formatCurrency(Number(donation.amount))}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={`${
                                donation.ship_type === 'fighter' 
                                  ? 'bg-blue-400/20 text-blue-400 border-blue-400' 
                                  : donation.ship_type === 'cruiser'
                                  ? 'bg-cyan-400/20 text-cyan-400 border-cyan-400'
                                  : donation.ship_type === 'battleship'
                                  ? 'bg-purple-400/20 text-purple-400 border-purple-400'
                                  : 'bg-green-400/20 text-green-400 border-green-400'
                              }`}
                              variant="outline"
                            >
                              {(donation.ship_type || 'fighter').toUpperCase()}
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
                  <div className="text-center text-gray-300">No missions launched yet</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export Section */}
          <div className="space-y-6">
            <DonationExport 
              tableName="space_command_donations" 
              streamerName="SpaceCommand"
            />
            
            <Card className="bg-black/60 border-cyan-400/50">
              <CardHeader>
                <CardTitle className="text-cyan-400">Mission Control</CardTitle>
                <CardDescription className="text-gray-300">Command center operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  onClick={() => window.open('/space-command', '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Mission Control
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-blue-400/50 text-blue-400 hover:bg-blue-400/10"
                  onClick={handleRefresh}
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Refresh Fleet Status
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceCommandDashboard;
