
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, calculateMonthlyTotal } from "@/utils/dashboardUtils";
import { LogOut, MessageSquare, Image, Mic, Volume2, MessageCircle } from "lucide-react";
import CSVExportDialog from "@/components/CSVExportDialog";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  created_at: string;
  payment_status: string;
  gif_url?: string;
  voice_url?: string;
  custom_sound_name?: string;
  custom_sound_url?: string;
  include_sound?: boolean;
}

const ChiaaGamingDashboard = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = sessionStorage.getItem("chiaaGamingAuth") === "true";
    if (!isAuthenticated) {
      navigate("/chiaa_gaming/login");
      return;
    }

    fetchDonations();
    
    // Cleanup any existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Set up real-time subscription with proper cleanup
    const setupRealtimeSubscription = () => {
      channelRef.current = supabase
        .channel('chiaa-gaming-donations-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chiaa_gaming_donations',
            filter: 'payment_status=eq.success'
          },
          (payload) => {
            console.log('New donation received:', payload);
            const newDonation = payload.new as Donation;
            setDonations(prev => [newDonation, ...prev]);
            setMonthlyTotal(prev => prev + Number(newDonation.amount));
            
            toast({
              title: "New Donation Received!",
              description: `${newDonation.name} donated ₹${Number(newDonation.amount).toLocaleString()}`,
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chiaa_gaming_donations',
            filter: 'payment_status=eq.success'
          },
          (payload) => {
            console.log('Donation updated:', payload);
            const updatedDonation = payload.new as Donation;
            setDonations(prev => 
              prev.map(donation => 
                donation.id === updatedDonation.id ? updatedDonation : donation
              )
            );
          }
        )
        .subscribe();

      console.log('Real-time subscription set up for chiaa_gaming_donations');
    };

    // Setup with a small delay to prevent WebSocket connection issues
    const timer = setTimeout(setupRealtimeSubscription, 100);

    return () => {
      clearTimeout(timer);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [navigate, toast]);

  const fetchDonations = async () => {
    try {
      const { data, error } = await supabase
        .from("chiaa_gaming_donations")
        .select("id, name, amount, message, created_at, payment_status, gif_url, voice_url, custom_sound_name, custom_sound_url, include_sound")
        .eq("payment_status", "success")
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
      setMonthlyTotal(calculateMonthlyTotal(data || []));
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
    sessionStorage.removeItem("chiaaGamingAuth");
    sessionStorage.removeItem("chiaaGamingAdminAuth");
    navigate("/chiaa_gaming/login");
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

  const renderMediaBadges = (donation: Donation) => {
    const badges = [];
    
    if (donation.gif_url) {
      badges.push(
        <Badge key="gif" variant="secondary" className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/50">
          <Image className="w-3 h-3 mr-1" />
          GIF
        </Badge>
      );
    }
    
    if (donation.voice_url) {
      badges.push(
        <Badge key="voice" variant="secondary" className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/50">
          <Mic className="w-3 h-3 mr-1" />
          Voice
        </Badge>
      );
    }
    
    if (donation.custom_sound_name || donation.custom_sound_url) {
      badges.push(
        <Badge key="sound" variant="secondary" className="text-xs bg-orange-500/20 text-orange-300 border-orange-500/50">
          <Volume2 className="w-3 h-3 mr-1" />
          Sound
        </Badge>
      );
    }
    
    if (donation.message && donation.message.trim() !== '') {
      badges.push(
        <Badge key="message" variant="secondary" className="text-xs bg-green-500/20 text-green-300 border-green-500/50">
          <MessageCircle className="w-3 h-3 mr-1" />
          Message
        </Badge>
      );
    }
    
    return badges;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-black flex items-center justify-center">
        <div className="text-lg text-pink-100">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-black p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-pink-100">Chiaa Gaming Dashboard</h1>
            <p className="text-pink-300">Donation management and analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate("/chiaa_gaming/messages")}
              className="border-pink-500/50 text-pink-100 hover:bg-pink-500/20"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </Button>
            <CSVExportDialog 
              tableName="chiaa_gaming_donations" 
              title="Export Donations to CSV" 
            />
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="border-pink-500/50 text-pink-100 hover:bg-pink-500/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Monthly Total Card */}
        <Card className="mb-6 bg-black/50 border-pink-500/30">
          <CardHeader>
            <CardTitle className="text-pink-100">Monthly Total</CardTitle>
            <CardDescription className="text-pink-300">Total donations received this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-400">
              {formatCurrency(monthlyTotal)}
            </div>
          </CardContent>
        </Card>

        {/* Donations Table */}
        <Card className="bg-black/50 border-pink-500/30">
          <CardHeader>
            <CardTitle className="text-pink-100">Recent Successful Payments</CardTitle>
            <CardDescription className="text-pink-300">All successful donations with media attachments</CardDescription>
          </CardHeader>
          <CardContent>
            {donations.length === 0 ? (
              <div className="text-center py-8 text-pink-300">
                No successful payments found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-pink-500/30">
                    <TableHead className="text-pink-200">Name</TableHead>
                    <TableHead className="text-pink-200">Amount</TableHead>
                    <TableHead className="text-pink-200">Date & Time</TableHead>
                    <TableHead className="text-pink-200">Media</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.map((donation) => (
                    <TableRow key={donation.id} className="border-pink-500/20 hover:bg-pink-500/10">
                      <TableCell className="font-medium text-pink-100">{donation.name}</TableCell>
                      <TableCell className="text-pink-400 font-semibold">
                        {formatCurrency(Number(donation.amount))}
                      </TableCell>
                      <TableCell className="text-pink-200">{formatDate(donation.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {renderMediaBadges(donation)}
                        </div>
                      </TableCell>
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

export default ChiaaGamingDashboard;
