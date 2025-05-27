
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp } from "lucide-react";
import { StreamerTableName } from "@/types/donations";

interface DonationRecord {
  amount: number;
  payment_status: string;
}

interface StreamerStats {
  totalDonations: number;
  totalDonationCount: number;
  totalPayout: number;
  platformFee: number;
}

const SingleStreamerAnalytics = () => {
  const [selectedStreamer, setSelectedStreamer] = useState<StreamerTableName | "">("");
  const [streamerStats, setStreamerStats] = useState<StreamerStats>({
    totalDonations: 0,
    totalDonationCount: 0,
    totalPayout: 0,
    platformFee: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const streamers = [
    { value: "ankit_donations" as StreamerTableName, label: "Ankit" },
    { value: "harish_donations" as StreamerTableName, label: "Harish" },
    { value: "mackle_donations" as StreamerTableName, label: "Mackle" },
    { value: "rakazone_donations" as StreamerTableName, label: "Rakazone" },
    { value: "chiaa_gaming_donations" as StreamerTableName, label: "Chiaa Gaming" }
  ];

  const fetchStreamerData = async (streamerTable: StreamerTableName) => {
    if (!streamerTable) return;
    
    setIsLoading(true);
    
    try {
      console.log(`Fetching data for ${streamerTable}`);
      
      const { data: donations, error } = await supabase
        .from(streamerTable)
        .select('amount, payment_status')
        .eq('payment_status', 'success');

      if (error) {
        console.error("Error fetching donations:", error);
        throw error;
      }

      // Make sure we have data and it's an array
      if (!donations || !Array.isArray(donations)) {
        console.log(`No donations found for ${streamerTable}`);
        setStreamerStats({
          totalDonations: 0,
          totalDonationCount: 0,
          totalPayout: 0,
          platformFee: 0
        });
        return;
      }

      // Type assertion since we know the structure matches DonationRecord
      const donationRecords = donations as DonationRecord[];
      const totalDonations = donationRecords.reduce((sum, donation) => sum + Number(donation.amount), 0);
      const totalDonationCount = donationRecords.length;
      const totalPayout = totalDonations * 0.95; // 95% to streamer
      const platformFee = totalDonations * 0.05; // 5% platform fee

      setStreamerStats({
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

  const handleStreamerChange = (value: string) => {
    setSelectedStreamer(value as StreamerTableName | "");
  };

  const selectedStreamerName = streamers.find(s => s.value === selectedStreamer)?.label || "";

  return (
    <div className="space-y-6">
      {/* Streamer Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Streamer</CardTitle>
          <CardDescription>Choose a streamer to view total donation analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedStreamer} onValueChange={handleStreamerChange}>
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
                  <div className="text-2xl font-bold">₹{streamerStats.totalDonations.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {streamerStats.totalDonationCount} successful donations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Streamer Payout (95%)</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ₹{streamerStats.totalPayout.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total amount to be paid
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Platform Fee (5%)</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    ₹{streamerStats.platformFee.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Platform revenue share
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
                    ₹{streamerStats.totalDonationCount > 0 ? Math.round(streamerStats.totalDonations / streamerStats.totalDonationCount) : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Per donation average
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {!isLoading && streamerStats.totalDonationCount === 0 && (
            <Card>
              <CardContent className="text-center py-8 text-slate-500">
                No successful donations found for {selectedStreamerName}.
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default SingleStreamerAnalytics;
