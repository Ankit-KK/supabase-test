
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, CheckCircle } from "lucide-react";

interface StreamerPayout {
  streamer_name: string;
  total_donations: number;
  donation_count: number;
  payout_amount: number;
  platform_fee: number;
}

interface DonationRecord {
  amount: number;
  payment_status: string;
}

const WeeklyPayoutsTab = () => {
  const [payouts, setPayouts] = useState<StreamerPayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const streamers = [
    { table: "ankit_donations", name: "Ankit" },
    { table: "harish_donations", name: "Harish" },
    { table: "mackle_donations", name: "Mackle" },
    { table: "rakazone_donations", name: "Rakazone" },
    { table: "chiaa_gaming_donations", name: "Chiaa Gaming" }
  ];

  useEffect(() => {
    fetchPayoutData();
  }, []);

  const fetchPayoutData = async () => {
    try {
      const payoutData: StreamerPayout[] = [];

      for (const streamer of streamers) {
        const { data: donations, error } = await supabase
          .from(streamer.table)
          .select('amount')
          .eq('payment_status', 'completed');

        if (error) {
          console.error(`Error fetching ${streamer.name} donations:`, error);
          continue;
        }

        const donationRecords = (donations || []) as DonationRecord[];
        const totalDonations = donationRecords.reduce((sum, donation) => sum + Number(donation.amount), 0);
        const donationCount = donationRecords.length;
        const payoutAmount = totalDonations * 0.7;
        const platformFee = totalDonations * 0.3;

        if (donationCount > 0) {
          payoutData.push({
            streamer_name: streamer.name,
            total_donations: totalDonations,
            donation_count: donationCount,
            payout_amount: payoutAmount,
            platform_fee: platformFee
          });
        }
      }

      setPayouts(payoutData);
    } catch (error) {
      console.error("Error fetching payout data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch payout data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalDonations = payouts.reduce((sum, payout) => sum + payout.total_donations, 0);
  const totalPayouts = payouts.reduce((sum, payout) => sum + payout.payout_amount, 0);
  const totalPlatformFees = payouts.reduce((sum, payout) => sum + payout.platform_fee, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalDonations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all streamers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalPayouts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              70% to streamers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₹{totalPlatformFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              30% platform fee
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Streamer Payouts</CardTitle>
          <CardDescription>
            Current payout amounts for all streamers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Streamer</TableHead>
                  <TableHead>Donations</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Payout (70%)</TableHead>
                  <TableHead>Platform Fee (30%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.streamer_name} className="hover:bg-slate-50">
                    <TableCell className="font-medium">{payout.streamer_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{payout.donation_count} donations</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ₹{payout.total_donations.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      ₹{payout.payout_amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-blue-600">
                      ₹{payout.platform_fee.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {payouts.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No streamers with completed donations found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklyPayoutsTab;
