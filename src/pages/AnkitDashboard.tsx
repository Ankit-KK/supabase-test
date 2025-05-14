
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { MessageSquare, FileText } from "lucide-react";
import { calculateMonthlyTotal, formatCurrency } from "@/utils/dashboardUtils";
import ContractSigningButton from "@/components/ContractSigningButton";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  created_at: string;
  payment_status: string;
}

const AnkitDashboard = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use the auth protection hook to guard this route
  useAuthProtection({
    redirectTo: "/ankit/login",
    authKey: "ankitAuth"
  });

  // Check admin status
  useEffect(() => {
    const adminStatus = sessionStorage.getItem("ankitAuth") === "true";
    setIsAdmin(adminStatus);
    
    // Check super admin status (logged in with admin_pass)
    const superAdminStatus = sessionStorage.getItem("ankitAdminAuth") === "true";
    setIsSuperAdmin(superAdminStatus);
  }, []);

  // Function to fetch donations data
  const fetchDonations = async () => {
    try {
      const { data, error } = await supabase
        .from("ankit_donations")
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
      .channel('ankit-dashboard-donations')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'ankit_donations',
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
          table: 'ankit_donations',
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
    sessionStorage.removeItem("ankitAuth");
    sessionStorage.removeItem("ankitAdminAuth");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    navigate("/ankit/login");
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

  // Calculate total monthly donations
  const monthlyTotal = calculateMonthlyTotal(donations);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Ankit Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <ContractSigningButton 
            streamerName="Ankit" 
            streamerType="ankit" 
          />
          <Button variant="outline" onClick={() => navigate("/ankit/messages")}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Donation Messages
          </Button>
          {/* Export Data button */}
          <Button onClick={() => navigate("/ankit/export")} className="gap-2">
            <FileText className="h-4 w-4" />
            Export Data
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <h3 className="text-sm font-medium text-muted-foreground">This Month</h3>
              <p className="text-2xl font-bold">
                {formatCurrency(monthlyTotal)}
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

export default AnkitDashboard;
