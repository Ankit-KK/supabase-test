
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, calculateMonthlyTotal } from "@/utils/dashboardUtils";
import { LogOut, MessageSquare, Clock, BarChart3, Settings } from "lucide-react";
import CSVExportDialog from "@/components/CSVExportDialog";
import SecureDataDisplay from "@/components/SecureDataDisplay";
import DashboardAnalytics from "@/components/DashboardAnalytics";
import TelegramModerators from "@/components/TelegramModerators";
import TelegramBotTesting from "@/components/TelegramBotTesting";
import TelegramWebhookSetup from "@/components/TelegramWebhookSetup";
import { logSecurityEvent } from "@/utils/rateLimiting";
import { useVoiceCleanup } from "@/hooks/useVoiceCleanup";

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
  const [connectionStatus, setConnectionStatus] = useState<string>('DISCONNECTED');
  const navigate = useNavigate();
  const { toast } = useToast();
  const channelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add voice cleanup hook
  useVoiceCleanup();

  const setupRealtimeSubscription = () => {
    // Clean up existing channel first
    if (channelRef.current) {
      console.log('Cleaning up existing channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Create a unique channel name with timestamp
    const channelName = `chiaa-gaming-donations-dashboard-${Date.now()}`;
    
    console.log('Setting up realtime subscription:', channelName);
    
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
          console.log('New successful donation received in dashboard:', payload);
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
        setConnectionStatus(status);
        
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to chiaa_gaming_donations dashboard realtime updates');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          logSecurityEvent('REALTIME_SUBSCRIPTION_ERROR', `Status: ${status}`);
          
          // Attempt to reconnect after a delay
          if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            console.log('Connection lost, attempting to reconnect in 5 seconds...');
            reconnectTimeoutRef.current = setTimeout(() => {
              setupRealtimeSubscription();
            }, 5000);
          }
        }
      });

    console.log('Dashboard real-time subscription set up for chiaa_gaming_donations');
  };

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = sessionStorage.getItem("chiaaGamingAuth") === "true";
    if (!isAuthenticated) {
      logSecurityEvent('UNAUTHORIZED_DASHBOARD_ACCESS', 'chiaa_gaming_dashboard');
      navigate("/chiaa_gaming/login");
      return;
    }

    fetchDonations();
    
    // Setup subscription with a small delay
    const timer = setTimeout(setupRealtimeSubscription, 1000);

    return () => {
      clearTimeout(timer);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
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
              <h1 className="text-3xl font-bold text-pink-100 flex items-center gap-2">
                <BarChart3 className="w-8 h-8" />
                Chiaa Gaming Dashboard
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-pink-300">Analytics and overview</p>
                <div className={`px-2 py-1 rounded-full text-xs ${
                  connectionStatus === 'SUBSCRIBED' 
                    ? 'bg-green-500/20 text-green-300' 
                    : connectionStatus === 'CLOSED' || connectionStatus === 'CHANNEL_ERROR'
                    ? 'bg-red-500/20 text-red-300'
                    : 'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {connectionStatus === 'SUBSCRIBED' ? '🟢 Live' : 
                   connectionStatus === 'CLOSED' ? '🔴 Reconnecting...' : 
                   `⚡ ${connectionStatus}`}
                </div>
              </div>
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
              <Button 
                variant="outline" 
                onClick={() => navigate("/chiaa_gaming/obs-settings")}
                className="border-pink-500/50 text-pink-100 hover:bg-pink-500/20"
              >
                <Settings className="w-4 h-4 mr-2" />
                OBS Settings
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

          {/* Analytics Cards */}
          <div className="mb-6">
            <DashboardAnalytics donations={donations} monthlyTotal={monthlyTotal} />
          </div>

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

          {/* Telegram Moderators Management */}
          <div className="mb-6">
            <TelegramModerators />
          </div>

          {/* Telegram Bot Testing */}
          <div className="mb-6">
            <TelegramBotTesting />
          </div>

          {/* Telegram Webhook Setup */}
          <div className="mb-6">
            <TelegramWebhookSetup />
          </div>

          {/* Recent Donations Summary */}
          <Card className="bg-black/50 border-pink-500/30">
            <CardHeader>
              <CardTitle className="text-pink-100">Recent Donations Summary</CardTitle>
              <CardDescription className="text-pink-300">
                Latest 5 successful donations - <Button 
                  variant="link" 
                  onClick={() => navigate("/chiaa_gaming/messages")}
                  className="text-pink-400 hover:text-pink-300 p-0 h-auto"
                >
                  View all messages →
                </Button>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {donations.length === 0 ? (
                <div className="text-center py-8 text-pink-300">
                  No donations found
                </div>
              ) : (
                <div className="space-y-3">
                  {donations.slice(0, 5).map((donation) => (
                    <div key={donation.id} className="flex items-center justify-between p-3 bg-pink-500/10 rounded-lg border border-pink-500/20">
                      <div>
                        <div className="font-medium text-pink-100">{donation.name}</div>
                        <div className="text-sm text-pink-300">
                          {new Date(donation.created_at).toLocaleString("en-IN")}
                        </div>
                      </div>
                      <div className="text-pink-400 font-semibold">
                        {formatCurrency(Number(donation.amount))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SecureDataDisplay>
  );
};

export default ChiaaGamingDashboard;
