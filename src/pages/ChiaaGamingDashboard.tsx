
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, calculateMonthlyTotal } from "@/utils/dashboardUtils";
import { LogOut, MessageSquare, Image, Mic, Volume2, MessageCircle, Clock, Play, Pause } from "lucide-react";
import CSVExportDialog from "@/components/CSVExportDialog";
import SecureDataDisplay from "@/components/SecureDataDisplay";
import { logSecurityEvent } from "@/utils/rateLimiting";

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
  const [realtimeAlert, setRealtimeAlert] = useState<Donation | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const channelRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = sessionStorage.getItem("chiaaGamingAuth") === "true";
    if (!isAuthenticated) {
      logSecurityEvent('UNAUTHORIZED_DASHBOARD_ACCESS', 'chiaa_gaming_dashboard');
      navigate("/chiaa_gaming/login");
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
      const channelName = `chiaa-gaming-donations-dashboard-realtime-${Date.now()}`;
      
      channelRef.current = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chiaa_gaming_donations',
            filter: 'payment_status=eq.success'
          },
          (payload) => {
            console.log('New successful donation received in dashboard (REALTIME - NO DELAY):', payload);
            const newDonation = payload.new as Donation;
            
            // Show realtime alert for streamer (immediate, no delay)
            setRealtimeAlert(newDonation);
            setTimeout(() => setRealtimeAlert(null), 8000);
            
            setDonations(prev => {
              // Check if donation already exists to prevent duplicates
              const exists = prev.some(d => d.id === newDonation.id);
              if (exists) return prev;
              return [newDonation, ...prev];
            });
            setMonthlyTotal(prev => prev + Number(newDonation.amount));
            
            logSecurityEvent('NEW_DONATION_RECEIVED', `Amount: ${newDonation.amount}, Name: ${newDonation.name}`);
            
            toast({
              title: "🎉 New Donation Received!",
              description: `${newDonation.name} donated ₹${Number(newDonation.amount).toLocaleString()} (OBS alert in 1 minute)`,
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
          console.log('Dashboard realtime subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to chiaa_gaming_donations dashboard realtime updates');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            logSecurityEvent('REALTIME_SUBSCRIPTION_ERROR', `Status: ${status}`);
          }
        });

      console.log('Dashboard real-time subscription set up for chiaa_gaming_donations (IMMEDIATE NOTIFICATIONS)');
    };

    // Setup subscription with a small delay
    const timer = setTimeout(setupRealtimeSubscription, 500);

    return () => {
      clearTimeout(timer);
      if (channelRef.current) {
        console.log('Dashboard component unmounting, cleaning up channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [navigate, toast]);

  const fetchDonations = async () => {
    try {
      logSecurityEvent('DASHBOARD_DATA_FETCH', 'chiaa_gaming_donations');
      
      const { data, error } = await supabase
        .from("chiaa_gaming_donations")
        .select("id, name, amount, message, created_at, payment_status, gif_url, voice_url, custom_sound_name, custom_sound_url, include_sound")
        .eq("payment_status", "success")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching donations:", error);
        logSecurityEvent('DATA_FETCH_ERROR', `chiaa_gaming_donations: ${error.message}`);
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
      logSecurityEvent('DASHBOARD_ERROR', error instanceof Error ? error.message : 'Unknown error');
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
    logSecurityEvent('USER_LOGOUT', 'chiaa_gaming_dashboard');
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

  const handlePlayVoice = async (voiceUrl: string, donationId: string) => {
    try {
      if (playingAudio === donationId) {
        // Stop current audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        setPlayingAudio(null);
        return;
      }

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // Create new audio element
      const audio = new Audio(voiceUrl);
      audioRef.current = audio;
      setPlayingAudio(donationId);

      audio.onended = () => {
        setPlayingAudio(null);
        audioRef.current = null;
      };

      audio.onerror = () => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to play voice message",
        });
        setPlayingAudio(null);
        audioRef.current = null;
      };

      await audio.play();
      
      logSecurityEvent('VOICE_MESSAGE_REPLAYED', `Donation ID: ${donationId}`);
      
    } catch (error) {
      console.error("Error playing voice:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to play voice message",
      });
      setPlayingAudio(null);
    }
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
        <div key="voice" className="flex items-center gap-1">
          <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/50">
            <Mic className="w-3 h-3 mr-1" />
            Voice
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-blue-300 hover:text-blue-100 hover:bg-blue-500/20"
            onClick={() => handlePlayVoice(donation.voice_url!, donation.id)}
            title={playingAudio === donation.id ? "Stop voice message" : "Play voice message"}
          >
            {playingAudio === donation.id ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3" />
            )}
          </Button>
        </div>
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

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-black flex items-center justify-center">
        <div className="text-lg text-pink-100">Loading...</div>
      </div>
    );
  }

  return (
    <SecureDataDisplay requiredAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-black p-4">
        {/* Realtime Alert for Streamer */}
        {realtimeAlert && (
          <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
            <div className="bg-gradient-to-r from-green-600/95 to-emerald-600/95 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-green-500/50 max-w-sm">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-100 font-bold text-lg">New Donation!</span>
                <Clock className="w-4 h-4 text-green-300" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-100 font-semibold">{realtimeAlert.name}</span>
                <span className="text-green-300 font-bold text-xl">₹{Number(realtimeAlert.amount).toLocaleString()}</span>
              </div>
              {realtimeAlert.message && (
                <p className="text-green-50 text-sm italic mb-2">"{realtimeAlert.message}"</p>
              )}
              <div className="flex items-center space-x-1 text-xs text-green-200">
                <Clock className="w-3 h-3" />
                <span>OBS alert in 1 minute</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-pink-100">Chiaa Gaming Dashboard</h1>
              <p className="text-pink-300">Real-time donation management (OBS alerts delayed by 1 minute)</p>
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

          {/* Info Card about OBS Delay */}
          <Card className="mb-6 bg-blue-900/20 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-blue-200 font-semibold">OBS Alert Delay</h3>
                  <p className="text-blue-300 text-sm">Donations appear here instantly but are delayed by 1 minute in OBS to give you time to prepare</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Donations Table */}
          <Card className="bg-black/50 border-pink-500/30">
            <CardHeader>
              <CardTitle className="text-pink-100">Recent Successful Payments</CardTitle>
              <CardDescription className="text-pink-300">All successful donations with media attachments (real-time updates)</CardDescription>
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
    </SecureDataDisplay>
  );
};

export default ChiaaGamingDashboard;
