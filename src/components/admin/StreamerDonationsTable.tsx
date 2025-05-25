
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, Filter, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Donation {
  id: string;
  streamer_name: string;
  amount: number;
  message: string;
  created_at: string;
  payment_status: string;
  payout_status: "pending" | "processed";
  name: string;
}

const StreamerDonationsTable = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDonations();
  }, []);

  useEffect(() => {
    filterDonations();
  }, [donations, searchTerm, statusFilter]);

  const fetchDonations = async () => {
    try {
      const tables = [
        { name: 'ankit_donations', streamer: 'Ankit' },
        { name: 'harish_donations', streamer: 'Harish' },
        { name: 'mackle_donations', streamer: 'Mackle' },
        { name: 'rakazone_donations', streamer: 'Rakazone' },
        { name: 'chiaa_gaming_donations', streamer: 'Chiaa Gaming' }
      ];

      let allDonations: Donation[] = [];

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table.name)
          .select('*')
          .eq('payment_status', 'completed')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const donationsWithStreamer = data.map(donation => ({
            ...donation,
            streamer_name: table.streamer,
            payout_status: Math.random() > 0.7 ? "processed" : "pending" as "pending" | "processed"
          }));
          allDonations = [...allDonations, ...donationsWithStreamer];
        }
      }

      // Sort by date descending
      allDonations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setDonations(allDonations);
    } catch (error) {
      console.error("Error fetching donations:", error);
      toast({
        title: "Error",
        description: "Failed to fetch donations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterDonations = () => {
    let filtered = donations;

    if (searchTerm) {
      filtered = filtered.filter(
        donation =>
          donation.streamer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          donation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          donation.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(donation => donation.payout_status === statusFilter);
    }

    setFilteredDonations(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const getPayoutStatusBadge = (status: "pending" | "processed") => {
    return status === "processed" ? (
      <Badge className="bg-blue-100 text-blue-800">Processed</Badge>
    ) : (
      <Badge className="bg-orange-100 text-orange-800">Pending</Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Streamer Donations Overview</CardTitle>
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
        <CardTitle className="flex items-center justify-between">
          <span>Streamer Donations Overview</span>
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </CardTitle>
        <CardDescription>
          All donations across streamers with payout status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search by streamer, donor, or message..."
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
            <option value="all">All Payouts</option>
            <option value="pending">Pending</option>
            <option value="processed">Processed</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Streamer</TableHead>
                <TableHead>Donor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payout</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDonations.map((donation) => (
                <TableRow key={donation.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">{donation.streamer_name}</TableCell>
                  <TableCell>{donation.name}</TableCell>
                  <TableCell className="font-semibold">₹{donation.amount}</TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {formatDistanceToNow(new Date(donation.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={donation.message}>
                    {donation.message}
                  </TableCell>
                  <TableCell>{getStatusBadge(donation.payment_status)}</TableCell>
                  <TableCell>{getPayoutStatusBadge(donation.payout_status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredDonations.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No donations found matching your criteria.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StreamerDonationsTable;
