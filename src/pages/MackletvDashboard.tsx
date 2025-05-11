
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { MessageSquare, Download } from "lucide-react";
import { objectsToCSV, downloadCSV, formatDateForFilename } from "@/utils/csvExport";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  created_at: string;
  payment_status: string;
}

const MackletvDashboard = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use the auth protection hook to guard this route
  useAuthProtection({
    redirectTo: "/mackletv/login",
    authKey: "mackletvAuth"
  });

  // Function to fetch donations data
  const fetchDonations = async () => {
    try {
      const { data, error } = await supabase
        .from("mackletv_donations")
        .select("*")
        .eq("payment_status", "success") // Only fetch successful payments
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setDonations(data || []);
      setLastRefresh(new Date());
      console.log("Dashboard data refreshed at:", new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Error fetching donations:", error);
      toast({
        variant: "destructive",
        title: "Failed to load data",
        description: "Could not retrieve donation information",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time subscription for new donations
  useEffect(() => {
    const channel = supabase
      .channel('mackletv-dashboard-donations')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'mackletv_donations',
          filter: 'payment_status=eq.success' // Only listen for successful payments
        },
        (payload) => {
          const newDonation = payload.new as Donation;
          console.log("New donation received in dashboard via realtime:", newDonation);
          setDonations(prev => [newDonation, ...prev]);
          toast({
            title: "New Donation Received",
            description: `${newDonation.name} donated ₹${Number(newDonation.amount).toLocaleString()}`,
          });
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'mackletv_donations',
          filter: 'payment_status=eq.success' // Only listen for successful payment updates
        },
        (payload) => {
          const updatedDonation = payload.new as Donation;
          console.log("Donation updated in dashboard via realtime:", updatedDonation);
          setDonations(prev => 
            prev.map(donation => 
              donation.id === updatedDonation.id ? updatedDonation : donation
            )
          );
        }
      )
      .subscribe();

    console.log("Dashboard realtime subscription set up");
    
    // Fetch donations once when component mounts
    fetchDonations();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const handleLogout = () => {
    sessionStorage.removeItem("mackletvAuth");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    navigate("/mackletv/login");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to handle CSV download
  const handleDownloadCSV = () => {
    if (donations.length === 0) {
      toast({
        title: "No data to download",
        description: "There are no donations to export to CSV",
        variant: "destructive"
      });
      return;
    }

    // Prepare data for CSV export with better column names
    const headers = {
      name: "Donor Name",
      amount: "Amount (₹)",
      message: "Message",
      created_at: "Date",
      payment_status: "Status"
    };

    // Format the data for CSV
    const formattedData = donations.map(donation => ({
      name: donation.name,
      amount: donation.amount,
      message: donation.message,
      created_at: formatDate(donation.created_at),
      payment_status: donation.payment_status
    }));

    // Generate and download the CSV
    const csvData = objectsToCSV(formattedData, headers);
    const filename = `mackletv-donations-${formatDateForFilename()}.csv`;
    downloadCSV(csvData, filename);

    toast({
      title: "Download started",
      description: `${donations.length} donations exported to CSV`,
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">MackleTv Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <Button variant="outline" onClick={() => navigate("/mackletv/messages")}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Donation Messages
          </Button>
          <Button variant="outline" onClick={handleDownloadCSV}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Donation Summary</CardTitle>
          <CardDescription>Overview of all donations received</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Donations</h3>
              <p className="text-2xl font-bold">{donations.length}</p>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Amount</h3>
              <p className="text-2xl font-bold">
                ₹{donations.reduce((sum, donation) => sum + Number(donation.amount), 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Successful Payments</h3>
              <p className="text-2xl font-bold">
                {donations.filter(d => d.payment_status === 'success').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Donations</CardTitle>
          <CardDescription>
            Donations update in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-4">Loading donation data...</p>
          ) : donations.length === 0 ? (
            <p className="text-center py-4">No donations found</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell>{formatDate(donation.created_at)}</TableCell>
                      <TableCell>{donation.name}</TableCell>
                      <TableCell>₹{Number(donation.amount).toLocaleString()}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{donation.message}</TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          donation.payment_status === 'success' ? 'bg-green-100 text-green-800' : 
                          donation.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {donation.payment_status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MackletvDashboard;
