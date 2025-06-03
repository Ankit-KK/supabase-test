
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Gamepad2, DollarSign, Users, TrendingUp, Download, Eye, RefreshCw, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, calculateMonthlyTotal } from "@/utils/dashboardUtils";
import DonationExport from "@/components/DonationExport";
import { toast } from "@/hooks/use-toast";

const RetroArcadeDashboard = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: donations = [], isLoading, refetch } = useQuery({
    queryKey: ["retro-arcade-donations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("retro_arcade_donations")
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
      title: "Game data refreshed",
      description: "Arcade stats have been updated",
    });
  };

  const totalAmount = donations.reduce((sum, donation) => sum + Number(donation.amount), 0);
  const monthlyTotal = calculateMonthlyTotal(donations);
  const recentDonations = donations.slice(0, 10);

  const powerupStats = donations.reduce((acc, donation) => {
    const powerup = donation.powerup_type || 'coin';
    acc[powerup] = (acc[powerup] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const animationStats = donations.reduce((acc, donation) => {
    const animation = donation.pixel_animation || 'bounce';
    acc[animation] = (acc[animation] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Gamepad2 className="h-8 w-8 text-pink-400" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Retro Arcade Dashboard
              </h1>
              <p className="text-gray-300">Pixel perfect analytics & high score tracking</p>
            </div>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="bg-pink-500 hover:bg-pink-600"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Arcade
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-black/40 border-pink-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-pink-400">Total Coins</CardTitle>
              <DollarSign className="h-4 w-4 text-pink-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(totalAmount)}</div>
              <p className="text-xs text-gray-400">Arcade earnings</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-purple-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-400">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(monthlyTotal)}</div>
              <p className="text-xs text-gray-400">Monthly tokens</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-pink-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-pink-400">Players</CardTitle>
              <Users className="h-4 w-4 text-pink-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{donations.length}</div>
              <p className="text-xs text-gray-400">Retro gamers</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-purple-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-400">Avg Score</CardTitle>
              <Zap className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(donations.length > 0 ? totalAmount / donations.length : 0)}
              </div>
              <p className="text-xs text-gray-400">Per game</p>
            </CardContent>
          </Card>
        </div>

        {/* Power-up & Animation Statistics */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-black/40 border-pink-400/30">
            <CardHeader>
              <CardTitle className="text-pink-400">Power-up Collection</CardTitle>
              <CardDescription className="text-gray-300">Item distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-yellow-400/10 rounded-lg border border-yellow-400/30">
                  <div className="text-xl font-bold text-yellow-400">{powerupStats.coin || 0}</div>
                  <div className="text-sm text-gray-400">🪙 Coins</div>
                </div>
                <div className="text-center p-3 bg-red-400/10 rounded-lg border border-red-400/30">
                  <div className="text-xl font-bold text-red-400">{powerupStats.heart || 0}</div>
                  <div className="text-sm text-gray-400">❤️ Hearts</div>
                </div>
                <div className="text-center p-3 bg-blue-400/10 rounded-lg border border-blue-400/30">
                  <div className="text-xl font-bold text-blue-400">{powerupStats.star || 0}</div>
                  <div className="text-sm text-gray-400">⭐ Stars</div>
                </div>
                <div className="text-center p-3 bg-green-400/10 rounded-lg border border-green-400/30">
                  <div className="text-xl font-bold text-green-400">{powerupStats.mushroom || 0}</div>
                  <div className="text-sm text-gray-400">🍄 Mushrooms</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-purple-400/30">
            <CardHeader>
              <CardTitle className="text-purple-400">Animation Effects</CardTitle>
              <CardDescription className="text-gray-300">Visual preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-pink-400/10 rounded-lg border border-pink-400/30">
                  <div className="text-xl font-bold text-pink-400">{animationStats.bounce || 0}</div>
                  <div className="text-sm text-gray-400">Bounce</div>
                </div>
                <div className="text-center p-3 bg-cyan-400/10 rounded-lg border border-cyan-400/30">
                  <div className="text-xl font-bold text-cyan-400">{animationStats.glow || 0}</div>
                  <div className="text-sm text-gray-400">Glow</div>
                </div>
                <div className="text-center p-3 bg-yellow-400/10 rounded-lg border border-yellow-400/30">
                  <div className="text-xl font-bold text-yellow-400">{animationStats.sparkle || 0}</div>
                  <div className="text-sm text-gray-400">Sparkle</div>
                </div>
                <div className="text-center p-3 bg-green-400/10 rounded-lg border border-green-400/30">
                  <div className="text-xl font-bold text-green-400">{animationStats.zoom || 0}</div>
                  <div className="text-sm text-gray-400">Zoom</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Donations */}
          <Card className="bg-black/40 border-pink-400/30">
            <CardHeader>
              <CardTitle className="text-pink-400">Recent High Scores</CardTitle>
              <CardDescription className="text-gray-300">Latest arcade activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="text-center text-gray-300">Loading game data...</div>
                ) : recentDonations.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-pink-400/30">
                        <TableHead className="text-pink-400">Player</TableHead>
                        <TableHead className="text-pink-400">Coins</TableHead>
                        <TableHead className="text-pink-400">Power-up</TableHead>
                        <TableHead className="text-pink-400">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentDonations.map((donation) => (
                        <TableRow key={donation.id} className="border-pink-400/20">
                          <TableCell className="text-white font-mono">{donation.name}</TableCell>
                          <TableCell className="text-pink-400 font-bold">
                            {formatCurrency(Number(donation.amount))}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={`${
                                donation.powerup_type === 'coin' 
                                  ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400' 
                                  : donation.powerup_type === 'heart'
                                  ? 'bg-red-400/20 text-red-400 border-red-400'
                                  : donation.powerup_type === 'star'
                                  ? 'bg-blue-400/20 text-blue-400 border-blue-400'
                                  : 'bg-green-400/20 text-green-400 border-green-400'
                              }`}
                              variant="outline"
                            >
                              {(donation.powerup_type || 'coin').toUpperCase()}
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
                  <div className="text-center text-gray-300">No games recorded yet</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export Section */}
          <div className="space-y-6">
            <DonationExport 
              tableName="retro_arcade_donations" 
              streamerName="RetroArcade"
            />
            
            <Card className="bg-black/40 border-purple-400/30">
              <CardHeader>
                <CardTitle className="text-purple-400">Arcade Controls</CardTitle>
                <CardDescription className="text-gray-300">Game management tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                  onClick={() => window.open('/retro-arcade', '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Arcade Game
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-pink-400/50 text-pink-400 hover:bg-pink-400/10"
                  onClick={handleRefresh}
                >
                  <Gamepad2 className="h-4 w-4 mr-2" />
                  Refresh Leaderboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetroArcadeDashboard;
