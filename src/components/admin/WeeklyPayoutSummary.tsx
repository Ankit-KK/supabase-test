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
      // Get current week (Saturday to Friday)
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

      // Fetch Ankit donations
      const { data: ankitData, error: ankitError } = await supabase
        .from('ankit_donations')
        .select('amount')
        .eq('payment_status', 'completed')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString());

      if (!ankitError && ankitData) {
        const totalAmount = ankitData.reduce((sum, donation) => sum + Number(donation.amount), 0);
        const netPayout = totalAmount * 0.7; // 70% payout rate

        weeklyPayouts.push({
          streamer_name: 'Ankit',
          total_donations: totalAmount,
          net_payout: netPayout,
          payout_method: 'UPI: ankit@paytm',
          last_payout_date: "2024-01-08",
          status: Math.random() > 0.5 ? "pending" : "processed",
          selected: false
        });
      }

      // Fetch Harish donations
      const { data: harishData, error: harishError } = await supabase
        .from('harish_donations')
        .select('amount')
        .eq('payment_status', 'completed')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString());

      if (!harishError && harishData) {
        const totalAmount = harishData.reduce((sum, donation) => sum + Number(donation.amount), 0);
        const netPayout = totalAmount * 0.7;

        weeklyPayouts.push({
          streamer_name: 'Harish',
          total_donations: totalAmount,
          net_payout: netPayout,
          payout_method: 'Bank Transfer',
          last_payout_date: "2024-01-08",
          status: Math.random() > 0.5 ? "pending" : "processed",
          selected: false
        });
      }

      // Fetch Mackle donations
      const { data: mackleData, error: mackleError } = await supabase
        .from('mackle_donations')
        .select('amount')
        .eq('payment_status', 'completed')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString());

      if (!mackleError && mackleData) {
        const totalAmount = mackleData.reduce((sum, donation) => sum + Number(donation.amount), 0);
        const netPayout = totalAmount * 0.7;

        weeklyPayouts.push({
          streamer_name: 'Mackle',
          total_donations: totalAmount,
          net_payout: netPayout,
          payout_method: 'UPI: mackle@gpay',
          last_payout_date: "2024-01-08",
          status: Math.random() > 0.5 ? "pending" : "processed",
          selected: false
        });
      }

      // Fetch Rakazone donations
      const { data: rakazoneData, error: rakazoneError } = await supabase
        .from('rakazone_donations')
        .select('amount')
        .eq('payment_status', 'completed')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString());

      if (!rakazoneError && rakazoneData) {
        const totalAmount = rakazoneData.reduce((sum, donation) => sum + Number(donation.amount), 0);
        const netPayout = totalAmount * 0.7;

        weeklyPayouts.push({
          streamer_name: 'Rakazone',
          total_donations: totalAmount,
          net_payout: netPayout,
          payout_method: 'UPI: rakazone@phonepe',
          last_payout_date: "2024-01-08",
          status: Math.random() > 0.5 ? "pending" : "processed",
          selected: false
        });
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

    toast({
      title: "Processing Payouts",
      description: `Processing ${selectedPayouts.length} payouts...`,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Weekly Payout Summary</span>
        </CardTitle>
        <CardDescription>
          Donations grouped from Saturday to Friday - {selectedCount} selected
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
                <TableHead>Total Donations</TableHead>
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
            No payouts found for this week.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklyPayoutSummary;
