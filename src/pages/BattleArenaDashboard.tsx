
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, DollarSign, Users, TrendingUp, Download, Eye, RefreshCw, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, calculateMonthlyTotal } from "@/utils/dashboardUtils";
import DonationExport from "@/components/DonationExport";
import { toast } from "@/hooks/use-toast";

const BattleArenaDashboard = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: donations = [], isLoading, refetch } = useQuery({
    queryKey: ["battle-arena-donations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("battle_arena_donations")
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
      title: "Battle data refreshed",
      description: "Arena statistics updated",
    });
  };

  const totalAmount = donations.reduce((sum, donation) => sum + Number(donation.amount), 0);
  const monthlyTotal = calculateMonthlyTotal(donations);
  const recentDonations = donations.slice(0, 10);

  const rankStats = donations.reduce((acc, donation) => {
    const rank = donation.military_rank || 'recruit';
    acc[rank] = (acc[rank] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const tacticalStats = donations.reduce((acc, donation) => {
    const tactical = donation.tactical_effect || 'smoke';
    acc[tactical] = (acc[tactical] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-orange-900 p-6">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-red-400" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Battle Arena Dashboard
              </h1>
              <p className="text-gray-300">Combat analytics & tactical operations</p>
            </div>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="bg-red-500 hover:bg-red-600"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Intel
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-black/40 border-red-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-400">Total Funding</CardTitle>
              <DollarSign className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(totalAmount)}</div>
              <p className="text-xs text-gray-400">War chest</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-orange-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-400">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(monthlyTotal)}</div>
              <p className="text-xs text-gray-400">Monthly operations</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-red-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-400">Soldiers</CardTitle>
              <Users className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{donations.length}</div>
              <p className="text-xs text-gray-400">Active troops</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-orange-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-400">Avg Support</CardTitle>
              <Target className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(donations.length > 0 ? totalAmount / donations.length : 0)}
              </div>
              <p className="text-xs text-gray-400">Per mission</p>
            </CardContent>
          </Card>
        </div>

        {/* Military Rank & Tactical Statistics */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-black/40 border-red-400/30">
            <CardHeader>
              <CardTitle className="text-red-400">Military Ranks</CardTitle>
              <CardDescription className="text-gray-300">Force composition</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-400/10 rounded-lg border border-green-400/30">
                  <div className="text-xl font-bold text-green-400">{rankStats.recruit || 0}</div>
                  <div className="text-sm text-gray-400">Recruits</div>
                </div>
                <div className="text-center p-3 bg-blue-400/10 rounded-lg border border-blue-400/30">
                  <div className="text-xl font-bold text-blue-400">{rankStats.sergeant || 0}</div>
                  <div className="text-sm text-gray-400">Sergeants</div>
                </div>
                <div className="text-center p-3 bg-yellow-400/10 rounded-lg border border-yellow-400/30">
                  <div className="text-xl font-bold text-yellow-400">{rankStats.lieutenant || 0}</div>
                  <div className="text-sm text-gray-400">Lieutenants</div>
                </div>
                <div className="text-center p-3 bg-red-400/10 rounded-lg border border-red-400/30">
                  <div className="text-xl font-bold text-red-400">{rankStats.captain || 0}</div>
                  <div className="text-sm text-gray-400">Captains</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-orange-400/30">
            <CardHeader>
              <CardTitle className="text-orange-400">Tactical Effects</CardTitle>
              <CardDescription className="text-gray-300">Combat strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-400/10 rounded-lg border border-gray-400/30">
                  <div className="text-xl font-bold text-gray-400">{tacticalStats.smoke || 0}</div>
                  <div className="text-sm text-gray-400">💨 Smoke</div>
                </div>
                <div className="text-center p-3 bg-red-400/10 rounded-lg border border-red-400/30">
                  <div className="text-xl font-bold text-red-400">{tacticalStats.explosion || 0}</div>
                  <div className="text-sm text-gray-400">💥 Explosion</div>
                </div>
                <div className="text-center p-3 bg-blue-400/10 rounded-lg border border-blue-400/30">
                  <div className="text-xl font-bold text-blue-400">{tacticalStats.flash || 0}</div>
                  <div className="text-sm text-gray-400">⚡ Flash</div>
                </div>
                <div className="text-center p-3 bg-green-400/10 rounded-lg border border-green-400/30">
                  <div className="text-xl font-bold text-green-400">{tacticalStats.stealth || 0}</div>
                  <div className="text-sm text-gray-400">🔍 Stealth</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Donations */}
          <Card className="bg-black/40 border-red-400/30">
            <CardHeader>
              <CardTitle className="text-red-400">Recent Battle Support</CardTitle>
              <CardDescription className="text-gray-300">Latest combat funding</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="text-center text-gray-300">Analyzing battle data...</div>
                ) : recentDonations.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-red-400/30">
                        <TableHead className="text-red-400">Soldier</TableHead>
                        <TableHead className="text-red-400">Funding</TableHead>
                        <TableHead className="text-red-400">Rank</TableHead>
                        <TableHead className="text-red-400">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentDonations.map((donation) => (
                        <TableRow key={donation.id} className="border-red-400/20">
                          <TableCell className="text-white font-mono">{donation.name}</TableCell>
                          <TableCell className="text-red-400 font-bold">
                            {formatCurrency(Number(donation.amount))}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={`${
                                donation.military_rank === 'recruit' 
                                  ? 'bg-green-400/20 text-green-400 border-green-400' 
                                  : donation.military_rank === 'sergeant'
                                  ? 'bg-blue-400/20 text-blue-400 border-blue-400'
                                  : donation.military_rank === 'lieutenant'
                                  ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400'
                                  : 'bg-red-400/20 text-red-400 border-red-400'
                              }`}
                              variant="outline"
                            >
                              {(donation.military_rank || 'recruit').toUpperCase()}
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
                  <div className="text-center text-gray-300">No battles recorded yet</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export Section */}
          <div className="space-y-6">
            <DonationExport 
              tableName="battle_arena_donations" 
              streamerName="BattleArena"
            />
            
            <Card className="bg-black/40 border-orange-400/30">
              <CardHeader>
                <CardTitle className="text-orange-400">Command Center</CardTitle>
                <CardDescription className="text-gray-300">Tactical operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                  onClick={() => window.open('/battle-arena', '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Battle Arena
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-red-400/50 text-red-400 hover:bg-red-400/10"
                  onClick={handleRefresh}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Refresh Battle Intel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattleArenaDashboard;
