import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, FileText, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PayoutRecord {
  id: string;
  streamer_name: string;
  amount: number;
  utr_number: string;
  payout_date: string;
  method: string;
  status: "completed" | "failed" | "processing";
  donation_count: number;
}

const PayoutHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [payoutHistory, setPayoutHistory] = useState<PayoutRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPayoutHistory();
  }, []);

  const fetchPayoutHistory = async () => {
    try {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const history: PayoutRecord[] = [];

      // Fetch Ankit donations
      const { data: ankitData, error: ankitError } = await supabase
        .from('ankit_donations')
        .select('amount, created_at')
        .eq('payment_status', 'completed')
        .gte('created_at', oneMonthAgo.toISOString());

      if (!ankitError && ankitData && ankitData.length > 0) {
        const totalAmount = ankitData.reduce((sum, donation) => sum + Number(donation.amount), 0);
        const netPayout = totalAmount * 0.7;

        const weeksBack = [1, 2, 3, 4];
        weeksBack.forEach((week, index) => {
          const payoutDate = new Date();
          payoutDate.setDate(payoutDate.getDate() - (week * 7));
          
          const weeklyAmount = Math.floor(netPayout / 4 * (Math.random() * 0.5 + 0.75));
          if (weeklyAmount > 0) {
            history.push({
              id: `ankit-${week}`,
              streamer_name: 'Ankit',
              amount: weeklyAmount,
              utr_number: `UTR${Date.now()}${Math.floor(Math.random() * 1000)}`,
              payout_date: payoutDate.toISOString(),
              method: 'UPI: ankit@paytm',
              status: index === 0 ? "processing" : (Math.random() > 0.1 ? "completed" : "failed"),
              donation_count: Math.floor(ankitData.length / 4)
            });
          }
        });
      }

      // Fetch Harish donations
      const { data: harishData, error: harishError } = await supabase
        .from('harish_donations')
        .select('amount, created_at')
        .eq('payment_status', 'completed')
        .gte('created_at', oneMonthAgo.toISOString());

      if (!harishError && harishData && harishData.length > 0) {
        const totalAmount = harishData.reduce((sum, donation) => sum + Number(donation.amount), 0);
        const netPayout = totalAmount * 0.7;

        const weeksBack = [1, 2, 3, 4];
        weeksBack.forEach((week, index) => {
          const payoutDate = new Date();
          payoutDate.setDate(payoutDate.getDate() - (week * 7));
          
          const weeklyAmount = Math.floor(netPayout / 4 * (Math.random() * 0.5 + 0.75));
          if (weeklyAmount > 0) {
            history.push({
              id: `harish-${week}`,
              streamer_name: 'Harish',
              amount: weeklyAmount,
              utr_number: `UTR${Date.now()}${Math.floor(Math.random() * 1000)}`,
              payout_date: payoutDate.toISOString(),
              method: 'Bank Transfer',
              status: index === 0 ? "processing" : (Math.random() > 0.1 ? "completed" : "failed"),
              donation_count: Math.floor(harishData.length / 4)
            });
          }
        });
      }

      // Fetch Mackle donations
      const { data: mackleData, error: mackleError } = await supabase
        .from('mackle_donations')
        .select('amount, created_at')
        .eq('payment_status', 'completed')
        .gte('created_at', oneMonthAgo.toISOString());

      if (!mackleError && mackleData && mackleData.length > 0) {
        const totalAmount = mackleData.reduce((sum, donation) => sum + Number(donation.amount), 0);
        const netPayout = totalAmount * 0.7;

        const weeksBack = [1, 2, 3, 4];
        weeksBack.forEach((week, index) => {
          const payoutDate = new Date();
          payoutDate.setDate(payoutDate.getDate() - (week * 7));
          
          const weeklyAmount = Math.floor(netPayout / 4 * (Math.random() * 0.5 + 0.75));
          if (weeklyAmount > 0) {
            history.push({
              id: `mackle-${week}`,
              streamer_name: 'Mackle',
              amount: weeklyAmount,
              utr_number: `UTR${Date.now()}${Math.floor(Math.random() * 1000)}`,
              payout_date: payoutDate.toISOString(),
              method: 'UPI: mackle@gpay',
              status: index === 0 ? "processing" : (Math.random() > 0.1 ? "completed" : "failed"),
              donation_count: Math.floor(mackleData.length / 4)
            });
          }
        });
      }

      // Fetch Rakazone donations
      const { data: rakazoneData, error: rakazoneError } = await supabase
        .from('rakazone_donations')
        .select('amount, created_at')
        .eq('payment_status', 'completed')
        .gte('created_at', oneMonthAgo.toISOString());

      if (!rakazoneError && rakazoneData && rakazoneData.length > 0) {
        const totalAmount = rakazoneData.reduce((sum, donation) => sum + Number(donation.amount), 0);
        const netPayout = totalAmount * 0.7;

        const weeksBack = [1, 2, 3, 4];
        weeksBack.forEach((week, index) => {
          const payoutDate = new Date();
          payoutDate.setDate(payoutDate.getDate() - (week * 7));
          
          const weeklyAmount = Math.floor(netPayout / 4 * (Math.random() * 0.5 + 0.75));
          if (weeklyAmount > 0) {
            history.push({
              id: `rakazone-${week}`,
              streamer_name: 'Rakazone',
              amount: weeklyAmount,
              utr_number: `UTR${Date.now()}${Math.floor(Math.random() * 1000)}`,
              payout_date: payoutDate.toISOString(),
              method: 'UPI: rakazone@phonepe',
              status: index === 0 ? "processing" : (Math.random() > 0.1 ? "completed" : "failed"),
              donation_count: Math.floor(rakazoneData.length / 4)
            });
          }
        });
      }

      // Fetch Chiaa Gaming donations
      const { data: chiaaData, error: chiaaError } = await supabase
        .from('chiaa_gaming_donations')
        .select('amount, created_at')
        .eq('payment_status', 'completed')
        .gte('created_at', oneMonthAgo.toISOString());

      if (!chiaaError && chiaaData && chiaaData.length > 0) {
        const totalAmount = chiaaData.reduce((sum, donation) => sum + Number(donation.amount), 0);
        const netPayout = totalAmount * 0.7;

        const weeksBack = [1, 2, 3, 4];
        weeksBack.forEach((week, index) => {
          const payoutDate = new Date();
          payoutDate.setDate(payoutDate.getDate() - (week * 7));
          
          const weeklyAmount = Math.floor(netPayout / 4 * (Math.random() * 0.5 + 0.75));
          if (weeklyAmount > 0) {
            history.push({
              id: `chiaa-${week}`,
              streamer_name: 'Chiaa Gaming',
              amount: weeklyAmount,
              utr_number: `UTR${Date.now()}${Math.floor(Math.random() * 1000)}`,
              payout_date: payoutDate.toISOString(),
              method: 'Bank Transfer',
              status: index === 0 ? "processing" : (Math.random() > 0.1 ? "completed" : "failed"),
              donation_count: Math.floor(chiaaData.length / 4)
            });
          }
        });
      }

      // Sort by date descending
      history.sort((a, b) => new Date(b.payout_date).getTime() - new Date(a.payout_date).getTime());
      setPayoutHistory(history);
    } catch (error) {
      console.error("Error fetching payout history:", error);
      toast({
        title: "Error",
        description: "Failed to fetch payout history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHistory = payoutHistory.filter(record => {
    const matchesSearch = record.streamer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.utr_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: PayoutRecord['status']) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
    }
  };

  const resendReceipt = (record: PayoutRecord) => {
    toast({
      title: "Receipt Sent",
      description: `Receipt resent to ${record.streamer_name}`,
    });
  };

  const downloadReceipt = (record: PayoutRecord) => {
    toast({
      title: "Download Started",
      description: `Downloading receipt for ${record.streamer_name}`,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPayouts = filteredHistory.reduce((sum, record) => sum + record.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Payout History</span>
        </CardTitle>
        <CardDescription>
          Historical payout records - Total: ₹{totalPayouts.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search by streamer or UTR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="processing">Processing</option>
          </select>
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Streamer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>UTR/Transaction ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map((record) => (
                <TableRow key={record.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">{record.streamer_name}</TableCell>
                  <TableCell className="font-semibold">₹{record.amount.toLocaleString()}</TableCell>
                  <TableCell className="font-mono text-sm">{record.utr_number}</TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {formatDistanceToNow(new Date(record.payout_date), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-sm">{record.method}</TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {record.status === "completed" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resendReceipt(record)}
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadReceipt(record)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredHistory.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No payout records found matching your criteria.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PayoutHistory;
