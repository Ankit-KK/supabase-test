
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles, DollarSign, Users, TrendingUp, Download, Eye, RefreshCw, Crown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, calculateMonthlyTotal } from "@/utils/dashboardUtils";
import DonationExport from "@/components/DonationExport";
import { toast } from "@/hooks/use-toast";

const MysticRealmDashboard = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: donations = [], isLoading, refetch } = useQuery({
    queryKey: ["mystic-realm-donations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mystic_realm_donations")
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
      title: "Magical data refreshed",
      description: "Dashboard has been updated with latest spell energy",
    });
  };

  const totalAmount = donations.reduce((sum, donation) => sum + Number(donation.amount), 0);
  const monthlyTotal = calculateMonthlyTotal(donations);
  const recentDonations = donations.slice(0, 10);

  const classStats = donations.reduce((acc, donation) => {
    const characterClass = donation.character_class || 'warrior';
    acc[characterClass] = (acc[characterClass] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const spellStats = donations.reduce((acc, donation) => {
    const spell = donation.spell_effect || 'sparkle';
    acc[spell] = (acc[spell] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 p-6">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Sparkles className="h-8 w-8 text-yellow-400" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-purple-400 bg-clip-text text-transparent">
                Mystic Realm Dashboard
              </h1>
              <p className="text-gray-300">Magical analytics & spell energy management</p>
            </div>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="bg-yellow-500 hover:bg-yellow-600"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Spell Data
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-black/40 border-yellow-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-400">Total Gold</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(totalAmount)}</div>
              <p className="text-xs text-gray-400">Realm treasury</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-purple-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-400">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(monthlyTotal)}</div>
              <p className="text-xs text-gray-400">Monthly offerings</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-yellow-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-400">Adventurers</CardTitle>
              <Users className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{donations.length}</div>
              <p className="text-xs text-gray-400">Brave supporters</p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-purple-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-400">Avg Offering</CardTitle>
              <Crown className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(donations.length > 0 ? totalAmount / donations.length : 0)}
              </div>
              <p className="text-xs text-gray-400">Per spell cast</p>
            </CardContent>
          </Card>
        </div>

        {/* Character Class & Spell Statistics */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-black/40 border-yellow-400/30">
            <CardHeader>
              <CardTitle className="text-yellow-400">Character Classes</CardTitle>
              <CardDescription className="text-gray-300">Hero distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-red-400/10 rounded-lg border border-red-400/30">
                  <div className="text-xl font-bold text-red-400">{classStats.warrior || 0}</div>
                  <div className="text-sm text-gray-400">Warriors</div>
                </div>
                <div className="text-center p-3 bg-blue-400/10 rounded-lg border border-blue-400/30">
                  <div className="text-xl font-bold text-blue-400">{classStats.mage || 0}</div>
                  <div className="text-sm text-gray-400">Mages</div>
                </div>
                <div className="text-center p-3 bg-green-400/10 rounded-lg border border-green-400/30">
                  <div className="text-xl font-bold text-green-400">{classStats.rogue || 0}</div>
                  <div className="text-sm text-gray-400">Rogues</div>
                </div>
                <div className="text-center p-3 bg-yellow-400/10 rounded-lg border border-yellow-400/30">
                  <div className="text-xl font-bold text-yellow-400">{classStats.paladin || 0}</div>
                  <div className="text-sm text-gray-400">Paladins</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-purple-400/30">
            <CardHeader>
              <CardTitle className="text-purple-400">Spell Effects</CardTitle>
              <CardDescription className="text-gray-300">Magic preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-yellow-400/10 rounded-lg border border-yellow-400/30">
                  <div className="text-xl font-bold text-yellow-400">{spellStats.sparkle || 0}</div>
                  <div className="text-sm text-gray-400">Sparkles</div>
                </div>
                <div className="text-center p-3 bg-red-400/10 rounded-lg border border-red-400/30">
                  <div className="text-xl font-bold text-red-400">{spellStats.fire || 0}</div>
                  <div className="text-sm text-gray-400">Fire</div>
                </div>
                <div className="text-center p-3 bg-blue-400/10 rounded-lg border border-blue-400/30">
                  <div className="text-xl font-bold text-blue-400">{spellStats.ice || 0}</div>
                  <div className="text-sm text-gray-400">Ice</div>
                </div>
                <div className="text-center p-3 bg-purple-400/10 rounded-lg border border-purple-400/30">
                  <div className="text-xl font-bold text-purple-400">{spellStats.lightning || 0}</div>
                  <div className="text-sm text-gray-400">Lightning</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Donations */}
          <Card className="bg-black/40 border-yellow-400/30">
            <CardHeader>
              <CardTitle className="text-yellow-400">Recent Magical Offerings</CardTitle>
              <CardDescription className="text-gray-300">Latest spell support</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="text-center text-gray-300">Gathering magical energy...</div>
                ) : recentDonations.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-yellow-400/30">
                        <TableHead className="text-yellow-400">Hero</TableHead>
                        <TableHead className="text-yellow-400">Gold</TableHead>
                        <TableHead className="text-yellow-400">Class</TableHead>
                        <TableHead className="text-yellow-400">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentDonations.map((donation) => (
                        <TableRow key={donation.id} className="border-yellow-400/20">
                          <TableCell className="text-white">{donation.name}</TableCell>
                          <TableCell className="text-yellow-400 font-bold">
                            {formatCurrency(Number(donation.amount))}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={`${
                                donation.character_class === 'warrior' 
                                  ? 'bg-red-400/20 text-red-400 border-red-400' 
                                  : donation.character_class === 'mage'
                                  ? 'bg-blue-400/20 text-blue-400 border-blue-400'
                                  : donation.character_class === 'rogue'
                                  ? 'bg-green-400/20 text-green-400 border-green-400'
                                  : 'bg-yellow-400/20 text-yellow-400 border-yellow-400'
                              }`}
                              variant="outline"
                            >
                              {(donation.character_class || 'warrior').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400">
                            {new Date(donation.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center text-gray-300">No magical offerings recorded</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export Section */}
          <div className="space-y-6">
            <DonationExport 
              tableName="mystic_realm_donations" 
              streamerName="MysticRealm"
            />
            
            <Card className="bg-black/40 border-purple-400/30">
              <CardHeader>
                <CardTitle className="text-purple-400">Magical Actions</CardTitle>
                <CardDescription className="text-gray-300">Realm management spells</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full bg-gradient-to-r from-yellow-500 to-purple-500 hover:from-yellow-600 hover:to-purple-600"
                  onClick={() => window.open('/mystic-realm', '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Offering Portal
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10"
                  onClick={handleRefresh}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Refresh Magic Energy
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MysticRealmDashboard;
