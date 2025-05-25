
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, CheckCircle, Clock } from "lucide-react";

interface WeeklyPayout {
  streamer_name: string;
  total_donations: number;
  net_payout: number;
  payout_method: string;
  last_payout_date: string;
  status: "pending" | "processed";
  selected: boolean;
  donation_count: number;
}

const WeeklyPayoutSummary = () => {
  const [payouts, setPayouts] = useState<WeeklyPayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    fetchWeeklyPayouts();
  }, []);

  useEffect(() => {
    setSelectedCount(payouts.filter(p => p.selected).length);
  }, [payouts]);

  const fetchWeeklyPayouts = async () => {
    try {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysUntilSaturday = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - daysUntilSaturday);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weeklyPayouts: WeeklyPayout[] = [];

      const streamers = [
        { table: 'ankit_donations', name: 'Ankit', method: 'UPI: ankit@paytm' },
        { table: 'harish_donations', name: 'Harish', method: 'Bank Transfer' },
        { table: 'mackle_donations', name: 'Mackle', method: 'UPI: mackle@gpay' },
        { table: 'rakazone_donations', name: 'Rakazone', method: 'UPI: rakazone@phonepe' },
        { table: 'chiaa_gaming_donations', name: 'Chiaa Gaming', method: 'Bank Transfer' }
      ];

      for (const streamer of streamers) {
        const { data, error } = await supabase
          .from(streamer.table)
          .select('amount, created_at')
          .eq('payment_status', 'completed')
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', weekEnd.toISOString());

        if (!error && data) {
          const totalAmount = data.reduce((sum, donation) => sum + Number(donation.amount), 0);
          const netPayout = totalAmount * 0.7; // 70% payout rate

          if (totalAmount > 0) { // Only include streamers with donations this week
            weeklyPayouts.push({
              streamer_name: streamer.name,
              total_donations: totalAmount,
              net_payout: netPayout,
              payout_method: streamer.method,
              last_payout_date: "2024-01-08", // This would come from a payouts history table
              status: Math.random() > 0.6 ? "pending" : "processed",
              selected: false,
              donation_count: data.length
            });
          }
        } else if (error) {
          console.error(`Error fetching ${streamer.table}:`, error);
        }
      }

      setPayouts(weeklyPayouts);
    } catch (error) {
      console.error("Error fetching weekly payouts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch weekly payouts",
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
        description: "Please select payouts to process",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = selectedPayouts.reduce((sum, payout) => sum + payout.net_payout, 0);

    toast({
      title: "Processing Payouts",
      description: `Processing ${selectedPayouts.length} payouts totaling ₹${totalAmount.toLocaleString()}...`,
    });

    // Update status to processed
    setPayouts(prev => prev.map(payout => 
      payout.selected ? { ...payout, status: "processed", selected: false } : payout
    ));
  };

  const getStatusBadge = (status: "pending" | "processed") => {
    return status === "processed" ? (
      <Badge className="bg-green-100 text-green-800 flex items-center space-x-1">
        <CheckCircle className="h-3 w-3" />
        <span>Processed</span>
      </Badge>
    ) : (
      <Badge className="bg-orange-100 text-orange-800 flex items-center space-x-1">
        <Clock className="h-3 w-3" />
        <span>Pending</span>
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Payout Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalWeeklyDonations = payouts.reduce((sum, payout) => sum + payout.total_donations, 0);
  const totalWeeklyPayouts = payouts.reduce((sum, payout) => sum + payout.net_payout, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Weekly Payout Summary</span>
        </CardTitle>
        <CardDescription>
          Donations from Saturday to Friday - {selectedCount} selected | Total: ₹{totalWeeklyDonations.toLocaleString()} | Payouts: ₹{totalWeeklyPayouts.toLocaleString()}
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
            Generate Report
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
                <TableHead>Net Payout</TableHead>
                <TableHead>Payout Method</TableHead>
                <TableHead>Last Payout</TableHead>
                <TableHead>Status</TableHead>
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
                  <TableCell>{payout.donation_count} donations</TableCell>
                  <TableCell>₹{payout.total_donations.toLocaleString()}</TableCell>
                  <TableCell className="font-semibold text-green-600">
                    ₹{payout.net_payout.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">{payout.payout_method}</TableCell>
                  <TableCell className="text-sm text-slate-600">{payout.last_payout_date}</TableCell>
                  <TableCell>{getStatusBadge(payout.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {payouts.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No donations found for this week.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklyPayoutSummary;
