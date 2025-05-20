
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

const RakazoneDashboard = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use the auth protection hook to guard this route
  useAuthProtection({
    redirectTo: "/rakazone/login",
    authKey: "rakazoneAuth"
  });

  // Function to fetch donations data
  const fetchDonations = async () => {
    try {
      const { data, error } = await supabase
        .from("rakazone_donations")
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
      .channel('rakazone-dashboard-donations')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'rakazone_donations',
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
          table: 'rakazone_donations',
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

    console.log("Dashboard realtime subscription set up for payment_status=success");
    
    // Fetch donations once when component mounts
    fetchDonations();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const handleLogout = () => {
    sessionStorage.removeItem("rakazoneAuth");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    navigate("/rakazone/login");
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
    <div className="container mx-auto py-8 px-4"
      style={{
        background: "linear-gradient(rgba(30, 0, 0, 0.95), rgba(30, 0, 0, 0.95))",
        minHeight: "100vh",
      }}
    >
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <img 
            src="/lovable-uploads/495326f5-a1c6-47a4-9e68-39f8372910a9.png" 
            alt="Rakazone Gaming" 
            className="h-12 w-12"
          />
          <h1 className="text-3xl font-bold text-red-500">Rakazone Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <ContractSigningButton 
            streamerName="Rakazone" 
            streamerType="rakazone" 
          />
          <Button variant="outline" onClick={() => navigate("/rakazone/messages")} className="border-red-500/30 hover:bg-red-900/20">
            <MessageSquare className="mr-2 h-4 w-4" />
            Donation Messages
          </Button>
          {/* Export Data button */}
          <Button onClick={() => navigate("/rakazone/export")} className="gap-2 bg-red-900 hover:bg-red-800">
            <FileText className="h-4 w-4" />
            Export Data
          </Button>
          <Button variant="outline" onClick={handleLogout} className="border-red-500/30 hover:bg-red-900/20">
            Logout
          </Button>
        </div>
      </div>

      <Card className="mb-8 border-red-500/30 bg-black/40">
        <CardHeader>
          <CardTitle className="text-red-400">Donation Summary</CardTitle>
          <CardDescription>Overview of all donations received</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-black/50 border border-red-500/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Donations</h3>
              <p className="text-2xl font-bold text-white">{donations.length}</p>
            </div>
            <div className="bg-black/50 border border-red-500/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Total Amount</h3>
              <p className="text-2xl font-bold text-white">
                ₹{donations.reduce((sum, donation) => sum + Number(donation.amount), 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-black/50 border border-red-500/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground">This Month</h3>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(monthlyTotal)}
              </p>
            </div>
            <div className="bg-black/50 border border-red-500/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Successful Payments</h3>
              <p className="text-2xl font-bold text-white">
                {donations.filter(d => d.payment_status === 'success').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-500/30 bg-black/40">
        <CardHeader>
          <CardTitle className="text-red-400">Recent Donations</CardTitle>
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
            <div className="rounded-md border border-red-500/20">
              <Table>
                <TableHeader>
                  <TableRow className="bg-black/50 border-b border-red-500/20">
                    <TableHead className="text-red-400">Date</TableHead>
                    <TableHead className="text-red-400">Name</TableHead>
                    <TableHead className="text-red-400">Amount</TableHead>
                    <TableHead className="text-red-400">Message</TableHead>
                    <TableHead className="text-red-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.map((donation) => (
                    <TableRow key={donation.id} className="border-b border-red-500/10">
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

export default RakazoneDashboard;
