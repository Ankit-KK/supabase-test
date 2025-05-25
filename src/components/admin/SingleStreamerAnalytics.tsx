
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { DollarSign, Calendar, TrendingUp } from "lucide-react";

interface WeeklyData {
  weekStart: string;
  weekEnd: string;
  totalDonations: number;
  donationCount: number;
  weeklyPayout: number;
}

interface StreamerStats {
  totalDonations: number;
  totalDonationCount: number;
  weeklyData: WeeklyData[];
}

const SingleStreamerAnalytics = () => {
  const [selectedStreamer, setSelectedStreamer] = useState<string>("");
  const [streamerStats, setStreamerStats] = useState<StreamerStats>({
    totalDonations: 0,
    totalDonationCount: 0,
    weeklyData: []
  });
  const [isLoading, setIsLoading] = useState(false);

  const streamers = [
    { value: "ankit_donations", label: "Ankit" },
    { value: "harish_donations", label: "Harish" },
    { value: "mackle_donations", label: "Mackle" },
    { value: "rakazone_donations", label: "Rakazone" },
    { value: "chiaa_gaming_donations", label: "Chiaa Gaming" }
  ];

  const getWeekRanges = () => {
    const weeks = [];
    const now = new Date();
    
    // Go back 12 weeks to show historical data
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(now.getDate() - (i * 7) - now.getDay() + 6); // Saturday
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Next Friday
      weekEnd.setHours(23, 59, 59, 999);
      
      weeks.push({ weekStart, weekEnd });
    }
    
    return weeks;
  };

  const fetchStreamerData = async (streamerTable: string) => {
    if (!streamerTable) return;
    
    setIsLoading(true);
    
    try {
      // Fetch all donations for total stats
      const { data: allDonations, error: allError } = await supabase
        .from(streamerTable as any)
        .select('amount, created_at')
        .eq('payment_status', 'completed');

      if (allError) throw allError;

      const totalDonations = allDonations?.reduce((sum, donation) => sum + Number(donation.amount), 0) || 0;
      const totalDonationCount = allDonations?.length || 0;

      // Fetch weekly data
      const weekRanges = getWeekRanges();
      const weeklyData: WeeklyData[] = [];

      for (const { weekStart, weekEnd } of weekRanges) {
        const { data: weeklyDonations, error: weeklyError } = await supabase
          .from(streamerTable as any)
          .select('amount, created_at')
          .eq('payment_status', 'completed')
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', weekEnd.toISOString());

        if (weeklyError) throw weeklyError;

        const weeklyTotal = weeklyDonations?.reduce((sum, donation) => sum + Number(donation.amount), 0) || 0;
        const weeklyCount = weeklyDonations?.length || 0;
        const weeklyPayout = weeklyTotal * 0.7; // 70% payout

        weeklyData.push({
          weekStart: weekStart.toLocaleDateString(),
          weekEnd: weekEnd.toLocaleDateString(),
          totalDonations: weeklyTotal,
          donationCount: weeklyCount,
          weeklyPayout
        });
      }

      setStreamerStats({
        totalDonations,
        totalDonationCount,
        weeklyData: weeklyData.reverse() // Most recent first
      });

    } catch (error) {
      console.error("Error fetching streamer data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch streamer data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStreamer) {
      fetchStreamerData(selectedStreamer);
    }
  }, [selectedStreamer]);

  const selectedStreamerName = streamers.find(s => s.value === selectedStreamer)?.label || "";

  return (
    <div className="space-y-6">
      {/* Streamer Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Streamer</CardTitle>
          <CardDescription>Choose a streamer to view detailed analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedStreamer} onValueChange={setSelectedStreamer}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Select a streamer" />
            </SelectTrigger>
            <SelectContent>
              {streamers.map((streamer) => (
                <SelectItem key={streamer.value} value={streamer.value}>
                  {streamer.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedStreamer && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{streamerStats.totalDonations.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {streamerStats.totalDonationCount} donations total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Payout</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ₹{(streamerStats.totalDonations * 0.7).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  70% of total donations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Share</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  ₹{(streamerStats.totalDonations * 0.3).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  30% platform fee
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Weekly Breakdown - {selectedStreamerName}</span>
              </CardTitle>
              <CardDescription>
                Donations and payouts by week (Saturday to Friday)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Week Period</TableHead>
                        <TableHead>Donations</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Payout (70%)</TableHead>
                        <TableHead>Platform Fee (30%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {streamerStats.weeklyData.map((week, index) => (
                        <TableRow key={index} className="hover:bg-slate-50">
                          <TableCell className="font-medium">
                            {week.weekStart} - {week.weekEnd}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{week.donationCount} donations</Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            ₹{week.totalDonations.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            ₹{week.weeklyPayout.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-blue-600">
                            ₹{(week.totalDonations * 0.3).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {!isLoading && streamerStats.weeklyData.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No donation data found for the selected period.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default SingleStreamerAnalytics;
