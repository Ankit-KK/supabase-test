
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthProtection } from "@/hooks/useAuthProtection";

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
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use the auth protection hook to guard this route
  useAuthProtection({
    redirectTo: "/ankit/login",
    authKey: "ankitAuth"
  });

  useEffect(() => {
    // Fetch initial donations data
    const fetchDonations = async () => {
      try {
        const { data, error } = await supabase
          .from("ankit_donations")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        setDonations(data || []);
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

    fetchDonations();

    // Set up real-time subscription for new donations
    // First, enable realtime for the table
    supabase.from('ankit_donations').on('*', (payload) => {
      console.log('Table subscription update received:', payload);
    }).subscribe();

    // Create a specific channel for detailed updates
    const channel = supabase
      .channel('ankit-donations-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'ankit_donations' 
        },
        async (payload) => {
          console.log('Real-time update received:', payload);
          
          // Immediately show toast for new donations
          if (payload.eventType === 'INSERT' && payload.new) {
            const newDonation = payload.new as Donation;
            toast({
              title: "New donation received!",
              description: `${newDonation.name} donated ₹${Number(newDonation.amount).toLocaleString()}`,
            });
          }
          
          // Refresh the entire donations list to ensure ordering is correct
          try {
            const { data, error } = await supabase
              .from("ankit_donations")
              .select("*")
              .order("created_at", { ascending: false });

            if (error) {
              console.error("Error refreshing donations:", error);
              return;
            }

            if (data) {
              console.log("Updated donations data:", data);
              setDonations(data);
            }
          } catch (error) {
            console.error("Error in real-time refresh:", error);
          }
        }
      )
      .subscribe((status) => {
        console.log("Channel status:", status);
      });

    // Cleanup subscription on component unmount
    return () => {
      console.log("Cleaning up Supabase channel");
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const handleLogout = () => {
    sessionStorage.removeItem("ankitAuth");
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Ankit Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
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
          <CardDescription>Live updates of all donations made to Ankit</CardDescription>
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
