
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthProtection } from "@/hooks/useAuthProtection";
import { MessageSquare, FileText, LogOut, IndianRupee } from "lucide-react";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  created_at: string;
  payment_status: string;
}

const AnkitDashboard = () => {
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [totalDonations, setTotalDonations] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use the auth protection hook to guard this route
  useAuthProtection({
    redirectTo: "/ankit/login",
    authKey: "ankitAuth"
  });

  // Function to fetch donation statistics
  const fetchDonationStats = async () => {
    try {
      const { data, error } = await supabase
        .from("ankit_donations")
        .select("*")
        .eq("payment_status", "success")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      if (data) {
        // Calculate current month total
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthlyDonations = data.filter(donation => {
          const donationDate = new Date(donation.created_at);
          return donationDate.getMonth() === currentMonth && 
                 donationDate.getFullYear() === currentYear;
        });
        
        const monthlySum = monthlyDonations.reduce((sum, donation) => sum + Number(donation.amount), 0);
        const totalSum = data.reduce((sum, donation) => sum + Number(donation.amount), 0);
        
        setMonthlyTotal(monthlySum);
        setTotalDonations(totalSum);
      }
    } catch (error) {
      console.error("Error fetching donation stats:", error);
      toast({
        variant: "destructive",
        title: "Failed to load data",
        description: "Could not retrieve donation statistics",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time subscription for new donations
  useEffect(() => {
    const channel = supabase
      .channel('ankit-dashboard-stats')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'ankit_donations',
          filter: 'payment_status=eq.success'
        },
        (payload) => {
          const newDonation = payload.new as Donation;
          console.log("New donation received:", newDonation);
          
          // Update stats in real-time
          fetchDonationStats();
          
          toast({
            title: "New Donation Received",
            description: `${newDonation.name} donated ₹${Number(newDonation.amount).toLocaleString()}`,
          });
        }
      )
      .subscribe();

    // Fetch initial stats
    fetchDonationStats();

    return () => {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getCurrentMonthName = () => {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Ankit Dashboard</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Stats Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-6 w-6" />
            Donation Summary
          </CardTitle>
          <CardDescription>Your donation statistics overview</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center p-6 bg-primary/5 rounded-lg border">
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  {getCurrentMonthName()}
                </h3>
                <p className="text-4xl font-bold text-primary">
                  {formatCurrency(monthlyTotal)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">This month's donations</p>
              </div>
              <div className="text-center p-6 bg-muted rounded-lg">
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  All Time Total
                </h3>
                <p className="text-4xl font-bold">
                  {formatCurrency(totalDonations)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">Total earnings</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>OBS Integration</span>
            </CardTitle>
            <CardDescription>Set up donation alerts for streaming</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate("/ankit/messages")} 
              className="w-full"
            >
              Manage OBS & Messages
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Export Data</span>
            </CardTitle>
            <CardDescription>Download donation data as CSV</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate("/ankit/export")} 
              className="w-full"
              variant="outline"
            >
              Export to CSV
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnkitDashboard;
