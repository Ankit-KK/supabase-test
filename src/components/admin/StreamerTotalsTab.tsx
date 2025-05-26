
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp } from "lucide-react";

interface DonationRecord {
  amount: number;
  payment_status: string;
}

const StreamerTotalsTab = () => {
  const [selectedStreamer, setSelectedStreamer] = useState<string>("");
  const [streamerTotals, setStreamerTotals] = useState({
    totalDonations: 0,
    totalDonationCount: 0,
    totalPayout: 0,
    platformFee: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const streamers = [
    { value: "ankit_donations", label: "Ankit" },
    { value: "harish_donations", label: "Harish" },
    { value: "mackle_donations", label: "Mackle" },
    { value: "rakazone_donations", label: "Rakazone" },
    { value: "chiaa_gaming_donations", label: "Chiaa Gaming" }
  ];

  const fetchStreamerData = async (streamerTable: string) => {
    if (!streamerTable) return;
    
    setIsLoading(true);
    
    try {
      const { data: donations, error } = await supabase
        .from(streamerTable)
        .select('amount')
        .eq('payment_status', 'completed');

      if (error) {
        console.error("Error fetching donations:", error);
        throw error;
      }

      const donationRecords = (donations || []) as DonationRecord[];
      const totalDonations = donationRecords.reduce((sum, donation) => sum + Number(donation.amount), 0);
      const totalDonationCount = donationRecords.length;
      const totalPayout = totalDonations * 0.7;
      const platformFee = totalDonations * 0.3;

      setStreamerTotals({
        totalDonations,
        totalDonationCount,
        totalPayout,
        platformFee
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Streamer</CardTitle>
          <CardDescription>Choose a streamer to view donation totals</CardDescription>
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
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{streamerTotals.totalDonations.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {streamerTotals.totalDonationCount} completed donations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Streamer Payout (70%)</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ₹{streamerTotals.totalPayout.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Amount to be paid
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Platform Fee (30%)</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    ₹{streamerTotals.platformFee.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Platform revenue
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Donation</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{streamerTotals.totalDonationCount > 0 ? Math.round(streamerTotals.totalDonations / streamerTotals.totalDonationCount) : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Per donation average
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StreamerTotalsTab;
