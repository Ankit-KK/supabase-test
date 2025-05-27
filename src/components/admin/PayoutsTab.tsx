
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, CheckCircle, Clock, Send } from "lucide-react";
import { StreamerTableName } from "@/types/donations";

interface DonationRecord {
  amount: number;
  payment_status: string;
}

interface StreamerPayout {
  streamer_name: string;
  table_name: string;
  total_donations: number;
  donation_count: number;
  payout_amount: number;
  platform_fee: number;
  selected: boolean;
}

const PayoutsTab = () => {
  const [payouts, setPayouts] = useState<StreamerPayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCount, setSelectedCount] = useState(0);

  const streamers = [
    { table: "ankit_donations" as StreamerTableName, name: "Ankit" },
    { table: "harish_donations" as StreamerTableName, name: "Harish" },
    { table: "mackle_donations" as StreamerTableName, name: "Mackle" },
    { table: "rakazone_donations" as StreamerTableName, name: "Rakazone" },
    { table: "chiaa_gaming_donations" as StreamerTableName, name: "Chiaa Gaming" }
  ];

  useEffect(() => {
    fetchPayoutData();
  }, []);

  useEffect(() => {
    setSelectedCount(payouts.filter(p => p.selected).length);
  }, [payouts]);

  const fetchPayoutData = async () => {
    try {
      const payoutData: StreamerPayout[] = [];

      for (const streamer of streamers) {
        console.log(`Fetching payout data for ${streamer.name}`);
        
        // First check all donations
        const { data: allDonations, error: allError } = await supabase
          .from(streamer.table)
          .select('amount, payment_status');

        if (allError) {
          console.error(`Error fetching all ${streamer.name} donations:`, allError);
        } else {
          console.log(`Total donations for ${streamer.name}:`, allDonations?.length || 0);
          console.log(`Sample data for ${streamer.name}:`, allDonations?.slice(0, 3));
        }

        // Then fetch completed donations
        const { data: donations, error } = await supabase
          .from(streamer.table)
          .select('amount, payment_status')
          .eq('payment_status', 'completed');

        if (error) {
          console.error(`Error fetching ${streamer.name} donations:`, error);
          continue;
        }

        // Type guard to ensure we have the right data structure
        if (!donations || !Array.isArray(donations)) {
          console.log(`No completed donations found for ${streamer.name}`);
          continue;
        }

        const donationRecords = donations as DonationRecord[];
        const totalDonations = donationRecords.reduce((sum, donation) => sum + Number(donation.amount), 0);
        const donationCount = donationRecords.length;
        const payoutAmount = totalDonations * 0.7;
        const platformFee = totalDonations * 0.3;

        console.log(`Calculated for ${streamer.name}:`, {
          totalDonations,
          donationCount,
          payoutAmount,
          platformFee
        });

        if (donationCount > 0) {
          payoutData.push({
            streamer_name: streamer.name,
            table_name: streamer.table,
            total_donations: totalDonations,
            donation_count: donationCount,
            payout_amount: payoutAmount,
            platform_fee: platformFee,
            selected: false
          });
        }
      }

      console.log("Final payout data:", payoutData);
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

  const toggleSelection = (index: number) => {
    setPayouts(prev => prev.map((payout, i) => 
      i === index ? { ...payout, selected: !payout.selected } : payout
    ));
  };

  const selectAll = () => {
    const allSelected = payouts.every(p => p.selected);
    setPayouts(prev => prev.map(payout => ({ ...payout, selected: !allSelected })));
  };

  const processBulkPayouts = () => {
    const selectedPayouts = payouts.filter(p => p.selected);
    if (selectedPayouts.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select streamers to process payouts",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = selectedPayouts.reduce((sum, payout) => sum + payout.payout_amount, 0);

    toast({
      title: "Processing Payouts",
      description: `Processing ${selectedPayouts.length} payouts totaling ₹${totalAmount.toLocaleString()}...`,
    });

    // Reset selections after processing
    setPayouts(prev => prev.map(payout => ({ ...payout, selected: false })));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Streamer Payouts</CardTitle>
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
      {/* Summary Cards */}
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

      {/* Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Send className="h-5 w-5" />
            <span>Streamer Payouts</span>
          </CardTitle>
          <CardDescription>
            Select streamers to process payouts - {selectedCount} selected
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button 
              onClick={processBulkPayouts}
              disabled={selectedCount === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              Process Selected ({selectedCount})
            </Button>
            <Button variant="outline" onClick={selectAll}>
              {payouts.every(p => p.selected) ? "Deselect All" : "Select All"}
            </Button>
            <Button variant="outline">
              Export Report
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={payouts.length > 0 && payouts.every(p => p.selected)}
                      onCheckedChange={selectAll}
                    />
                  </TableHead>
                  <TableHead>Streamer</TableHead>
                  <TableHead>Donations</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Payout (70%)</TableHead>
                  <TableHead>Platform Fee (30%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout, index) => (
                  <TableRow key={payout.streamer_name} className="hover:bg-slate-50">
                    <TableCell>
                      <Checkbox
                        checked={payout.selected}
                        onCheckedChange={() => toggleSelection(index)}
                      />
                    </TableCell>
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
              <div className="text-sm mt-2">
                Check console logs for detailed database information.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PayoutsTab;
