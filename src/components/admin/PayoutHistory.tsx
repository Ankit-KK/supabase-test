
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, FileText, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PayoutRecord {
  id: string;
  streamer_name: string;
  amount: number;
  utr_number: string;
  payout_date: string;
  method: string;
  status: "completed" | "failed" | "processing";
}

const PayoutHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const payoutHistory: PayoutRecord[] = [
    {
      id: "1",
      streamer_name: "Ankit",
      amount: 12500,
      utr_number: "UTR2024011501",
      payout_date: "2024-01-15T10:30:00Z",
      method: "UPI: ankit@paytm",
      status: "completed"
    },
    {
      id: "2",
      streamer_name: "Harish",
      amount: 8750,
      utr_number: "TXN2024011502",
      payout_date: "2024-01-15T11:45:00Z",
      method: "Bank Transfer",
      status: "completed"
    },
    {
      id: "3",
      streamer_name: "Mackle",
      amount: 15200,
      utr_number: "UTR2024011503",
      payout_date: "2024-01-14T16:20:00Z",
      method: "UPI: mackle@gpay",
      status: "failed"
    },
    {
      id: "4",
      streamer_name: "Rakazone",
      amount: 9800,
      utr_number: "UTR2024011504",
      payout_date: "2024-01-14T14:15:00Z",
      method: "UPI: rakazone@phonepe",
      status: "completed"
    },
    {
      id: "5",
      streamer_name: "Chiaa Gaming",
      amount: 6300,
      utr_number: "PENDING",
      payout_date: "2024-01-16T09:00:00Z",
      method: "Bank Transfer",
      status: "processing"
    }
  ];

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
    // Simulate resending receipt
    console.log(`Resending receipt for ${record.streamer_name}`);
  };

  const downloadReceipt = (record: PayoutRecord) => {
    // Simulate downloading receipt
    console.log(`Downloading receipt for ${record.streamer_name}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Payout History</span>
        </CardTitle>
        <CardDescription>
          Detailed history of all processed payouts
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
