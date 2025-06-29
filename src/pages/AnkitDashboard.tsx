
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, calculateMonthlyTotal } from "@/utils/dashboardUtils";
import { LogOut, MessageSquare } from "lucide-react";
import CSVExportDialog from "@/components/CSVExportDialog";

interface Donation {
  id: string;
  name: string;
  amount: number;
  created_at: string;
  payment_status: string;
  selected_emoji?: string;
}

const AnkitDashboard = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = sessionStorage.getItem("ankitAuth") === "true";
    if (!isAuthenticated) {
      navigate("/ankit/login");
      return;
    }

    fetchDonations();
    
    // Set up real-time subscription
    const setupRealtimeSubscription = () => {
      // Clean up existing channel first
      if (channelRef.current) {
        console.log('Cleaning up existing channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Create a unique channel name
      const channelName = `ankit-donations-realtime-${Date.now()}`;
      
      channelRef.current = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'ankit_donations'
          },
          (payload) => {
            console.log('New donation received via realtime:', payload);
            const newDonation = payload.new as Donation;
            setDonations(prev => {
              // Check if donation already exists to prevent duplicates
              const exists = prev.some(d => d.id === newDonation.id);
              if (exists) return prev;
              return [newDonation, ...prev];
            });
            
            // Only update monthly total for successful payments
            if (newDonation.payment_status === 'success') {
              setMonthlyTotal(prev => prev + Number(newDonation.amount));
            }
            
            toast({
              title: `${newDonation.payment_status === 'success' ? 'New Donation Received!' : 'Payment Status Updated'}`,
              description: `${newDonation.name} - ₹${Number(newDonation.amount).toLocaleString()} (${newDonation.payment_status})`,
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'ankit_donations'
          },
          (payload) => {
            console.log('Donation updated via realtime:', payload);
            const updatedDonation = payload.new as Donation;
            setDonations(prev => 
              prev.map(donation => 
                donation.id === updatedDonation.id ? updatedDonation : donation
              )
            );
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to ankit_donations realtime updates');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Channel subscription error');
          } else if (status === 'TIMED_OUT') {
            console.error('Channel subscription timed out');
          }
        });

      console.log('Real-time subscription set up for ankit_donations');
    };

    // Setup subscription with a small delay
    const timer = setTimeout(setupRealtimeSubscription, 500);

    return () => {
      clearTimeout(timer);
      if (channelRef.current) {
        console.log('Component unmounting, cleaning up channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [navigate, toast]);

  const fetchDonations = async () => {
    try {
      const { data, error } = await supabase
        .from("ankit_donations")
        .select("id, name, amount, created_at, payment_status, selected_emoji")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching donations:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch donations",
        });
        return;
      }

      setDonations(data || []);
      // Only calculate monthly total from successful payments
      const successfulDonations = (data || []).filter(d => d.payment_status === 'success');
      setMonthlyTotal(calculateMonthlyTotal(successfulDonations));
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("ankitAuth");
    sessionStorage.removeItem("ankitAdminAuth");
    navigate("/ankit/login");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Success</span>;
      case 'failed':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Failed</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Ankit Dashboard</h1>
            <p className="text-muted-foreground">Donation management and analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate("/ankit/messages")}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </Button>
            <CSVExportDialog 
              tableName="ankit_donations" 
              title="Export Donations to CSV" 
            />
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Monthly Total Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Monthly Total (Successful Payments)</CardTitle>
            <CardDescription>Total successful donations received this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(monthlyTotal)}
            </div>
          </CardContent>
        </Card>

        {/* Donations Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Donations</CardTitle>
            <CardDescription>All donation attempts with celebration emojis and payment status</CardDescription>
          </CardHeader>
          <CardContent>
            {donations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No donations found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Celebration</TableHead>
                    <TableHead>Date & Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell className="font-medium">{donation.name}</TableCell>
                      <TableCell className={`font-semibold ${donation.payment_status === 'success' ? 'text-green-600' : 'text-gray-600'}`}>
                        {formatCurrency(Number(donation.amount))}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(donation.payment_status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {donation.selected_emoji && (
                            <span className="text-2xl" title="Celebration emoji">
                              {donation.selected_emoji}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(donation.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnkitDashboard;
