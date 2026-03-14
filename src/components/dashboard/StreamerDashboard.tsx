import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { DollarSign, Users, TrendingUp, Clock, AlertCircle, LogOut, Shield } from "lucide-react";
import DonationCard from "./DonationCard";
import VoiceTranscriber from "./VoiceTranscriber";
import { ModeratorManager } from "./ModeratorManager";
import OBSTokenManager from "./OBSTokenManager";
import CSVExportButton from "./CSVExportButton";
import ModerationPanel from "./moderation/ModerationPanel";
import { usePusherDashboard } from "@/hooks/usePusherDashboard";
import { usePusherConfig } from "@/hooks/usePusherConfig";
import { convertToINR } from "@/constants/currencies";

interface StreamerDashboardProps {
  streamerSlug: string;
  streamerName: string;
  brandColor?: string;
  tableName: string;
  enableVoiceTranscription?: boolean;
}

interface DashboardStats {
  totalRevenue: number;
  todayRevenue: number;
  totalDonations: number;
  averageDonation: number;
  topDonation: number;
}

interface DonationRecord {
  id: string;
  name: string;
  amount: number;
  currency?: string;
  message?: string;
  voice_message_url?: string;
  tts_audio_url?: string;
  hypersound_url?: string;
  is_hyperemote?: boolean;
  media_url?: string;
  media_type?: string;
  moderation_status: string;
  payment_status: string;
  created_at: string;
  message_visible?: boolean;
  streamer_id: string;
}

const StreamerDashboard: React.FC<StreamerDashboardProps> = ({
  streamerSlug,
  streamerName,
  brandColor = "#3b82f6",
  tableName,
  enableVoiceTranscription = false,
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [streamerData, setStreamerData] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    todayRevenue: 0,
    totalDonations: 0,
    averageDonation: 0,
    topDonation: 0,
  });
  const [approvedDonations, setApprovedDonations] = useState<DonationRecord[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastDonationUpdate, setLastDonationUpdate] = useState<any>(null);

  // Get Pusher config from backend
  const { config: pusherConfig } = usePusherConfig(streamerSlug);

  // Real-time dashboard updates via Pusher
  const { connectionStatus: pusherStatus, stats: pusherStats } = usePusherDashboard({
    streamerSlug,
    pusherKey: pusherConfig?.key,
    pusherCluster: pusherConfig?.cluster,
    onNewDonation: (donation) => {
      console.log("[Dashboard] New donation via Pusher:", donation);

      // Only add to approved list if already approved (auto_approve mode)
      // Pending donations will be handled by moderation panel
      const isApproved =
        donation.payment_status === "success" &&
        (donation.moderation_status === "approved" ||
          donation.moderation_status === "auto_approved" ||
          donation.moderation_status === null);

      if (isApproved) {
        // Incremental update - add donation directly instead of full refetch (reduces egress)
        // Create a DonationRecord from the Pusher event data with ALL fields
        const newDonation: DonationRecord = {
          id: donation.id,
          name: donation.name,
          amount: donation.amount,
          currency: donation.currency,
          message: donation.message,
          voice_message_url: donation.voice_message_url,
          tts_audio_url: donation.tts_audio_url,
          hypersound_url: donation.hypersound_url,
          is_hyperemote: donation.is_hyperemote,
          media_url: donation.media_url,
          media_type: donation.media_type,
          message_visible: donation.message_visible ?? true, // Default to true for new donations
          moderation_status: donation.moderation_status | null,
          payment_status: "success", // Only successful donations are pushed
          created_at: donation.created_at,
          streamer_id: streamerData?.id || "",
        };
        setApprovedDonations((prev) => [newDonation, ...prev.slice(0, 49)]);
      }

      // Update stats incrementally for ALL successful donations
      const donationAmountINR = convertToINR(
        parseFloat(donation.amount?.toString() || "0"),
        donation.currency || "INR",
      );
      const today = new Date().toDateString();
      const isToday = new Date(donation.created_at).toDateString() === today;
      setStats((prev) => ({
        ...prev,
        totalRevenue: prev.totalRevenue + donationAmountINR,
        todayRevenue: isToday ? prev.todayRevenue + donationAmountINR : prev.todayRevenue,
        totalDonations: prev.totalDonations + 1,
        averageDonation: (prev.totalRevenue + donationAmountINR) / (prev.totalDonations + 1),
        topDonation: Math.max(prev.topDonation, donationAmountINR),
      }));

      // Show toast for all donations (both approved and pending)
      toast({
        title: isApproved ? "New Donation!" : "🔔 New Donation (Pending)",
        description: `${donation.name} donated ₹${donation.amount}${!isApproved ? " - needs approval" : ""}`,
      });
    },
    onDonationUpdated: (data) => {
      console.log("[Dashboard] Donation update via Pusher:", data);
      setLastDonationUpdate(data);

      if (data.id) {
        if (data.action === "approve" || data.action === "auto_approved") {
          // ADD newly approved donation to the list (it wasn't there before)
          setApprovedDonations((prev) => {
            // Check if already exists to prevent duplicates
            if (prev.some((d) => d.id === data.id)) {
              return prev.map((d) =>
                d.id === data.id
                  ? { ...d, moderation_status: "approved", message_visible: data.message_visible ?? d.message_visible }
                  : d,
              );
            }
            // Add new approved donation
            const newDonation: DonationRecord = {
              id: data.id,
              name: data.name,
              amount: data.amount,
              currency: data.currency,
              message: data.message,
              voice_message_url: data.voice_message_url,
              tts_audio_url: data.tts_audio_url,
              hypersound_url: data.hypersound_url,
              media_url: data.media_url,
              media_type: data.media_type,
              message_visible: data.message_visible ?? true,
              moderation_status: "approved",
              payment_status: "success",
              created_at: data.created_at,
              streamer_id: streamerData?.id || "",
            };
            return [newDonation, ...prev.slice(0, 49)];
          });
        } else if (data.action === "reject") {
          // Remove rejected donation from list
          setApprovedDonations((prev) => prev.filter((d) => d.id !== data.id));
        } else if (data.action === "hide_message" || data.action === "unhide_message") {
          // Update visibility only
          setApprovedDonations((prev) =>
            prev.map((d) => (d.id === data.id ? { ...d, message_visible: data.action === "unhide_message" } : d)),
          );
        }
      }
    },
    onStatsUpdate: (newStats) => {
      console.log("[Dashboard] Stats update via Pusher:", newStats);
      setStats((prev) => ({ ...prev, ...newStats }));
    },
  });

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your dashboard.",
      });
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Logout Error",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Real-time updates now handled by Pusher (usePusherDashboard hook above)
  // Removed 30-second polling - Pusher provides instant updates

  // Fetch streamer data and verify access
  useEffect(() => {
    const fetchStreamerData = async () => {
      if (!user) return;

      try {
        // Scoped fields (no select('*'))
        const { data: streamer, error: streamerError } = await supabase
          .from("streamers")
          .select(
            "id, streamer_slug, streamer_name, user_id, brand_color, moderation_mode, tts_enabled, media_upload_enabled, media_moderation_enabled, hyperemotes_enabled, leaderboard_widget_enabled, pusher_group",
          )
          .eq("streamer_slug", streamerSlug)
          .single();

        if (streamerError) throw streamerError;

        // Check if user owns this streamer or is admin
        // For the custom auth system, check if streamer has no user_id (legacy) or matches current user
        const isOwner = !streamer.user_id || streamer.user_id === user.id;
        // TODO: Add admin check here when admin system is implemented
        const isAdmin = user?.role === "admin";

        if (!isOwner && !isAdmin) {
          console.log("Access check failed:", {
            streamerUserId: streamer.user_id,
            currentUserId: user.id,
            userRole: user?.role,
          });
          toast({
            title: "Access Denied",
            description: "You don't have permission to view this dashboard.",
            variant: "destructive",
          });
          return;
        }

        setStreamerData(streamer);
      } catch (error) {
        console.error("Error fetching streamer data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStreamerData();
  }, [user, streamerSlug]);

  // Fetch dashboard stats and donations via edge function (donation tables are locked down)
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!streamerData?.id) return;

      try {
        const authToken = localStorage.getItem("auth_token");
        if (!authToken) {
          console.error("No auth token found");
          return;
        }
        const { data, error } = await supabase.functions.invoke("get-dashboard-donations", {
          headers: { "x-auth-token": authToken },
          body: { streamerSlug },
        });

        if (error) throw error;

        if (data?.stats) {
          setStats(data.stats);
        }
        if (data?.donations) {
          setApprovedDonations(data.donations);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, [streamerData?.id, streamerSlug, refreshKey]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <CardContent>
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">Please log in to access your dashboard.</p>
            <Button
              onClick={() => navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`)}
              className="w-full"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!streamerData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to view this dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: brandColor }}>
                {streamerName} Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">Manage your donations and settings</p>
              <div className="flex items-center mt-2 space-x-2">
                <Badge
                  variant={pusherStatus === "connected" ? "default" : "secondary"}
                  className={
                    pusherStatus === "connected"
                      ? "bg-green-600"
                      : pusherStatus === "connecting"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }
                >
                  {pusherStatus === "connected"
                    ? "🟢 Live"
                    : pusherStatus === "connecting"
                      ? "🟡 Connecting..."
                      : "🔴 Disconnected"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {pusherStatus === "connected" ? "Real-time updates active" : "Click refresh for latest data"}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => setRefreshKey((prev) => prev + 1)}>
                Refresh Data
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">From {stats.totalDonations} donations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.todayRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Today's earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Donation</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.averageDonation.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Per donation</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="moderation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="moderation" className="flex items-center gap-1">
              <Shield className="h-4 w-4" /> Moderation
            </TabsTrigger>
            <TabsTrigger value="donations">Approved Donations</TabsTrigger>
            <TabsTrigger value="telegram">Notifications</TabsTrigger>
            <TabsTrigger value="obs">OBS Setup</TabsTrigger>
          </TabsList>

          <TabsContent value="moderation" className="space-y-6">
            <ModerationPanel
              streamerId={streamerData.id}
              streamerSlug={streamerSlug}
              tableName={tableName}
              brandColor={brandColor}
              isConnected={pusherStatus === "connected"}
              onDonationUpdate={lastDonationUpdate}
            />
          </TabsContent>

          <TabsContent value="donations" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Approved Donations</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Donations that have been approved and are visible to viewers
                    </p>
                  </div>
                  <CSVExportButton streamerId={streamerData.id} tableName={tableName} streamerName={streamerName} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {approvedDonations.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No approved donations yet. Donations will appear here once they're approved.
                    </p>
                  ) : (
                    approvedDonations.map((donation) => (
                      <div key={donation.id}>
                        <DonationCard donation={donation} brandColor={brandColor} />
                        {enableVoiceTranscription && donation.voice_message_url && (
                          <VoiceTranscriber
                            voiceUrl={donation.voice_message_url}
                            donationId={donation.id}
                            streamerSlug={streamerSlug}
                            brandColor={brandColor}
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="telegram" className="space-y-6 data-[state=inactive]:hidden" forceMount>
            <ModeratorManager streamerId={streamerData.id} />
          </TabsContent>

          <TabsContent value="obs" className="space-y-6">
            <OBSTokenManager
              streamerId={streamerData.id}
              streamerSlug={streamerSlug}
              brandColor={brandColor}
              tableName={tableName}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StreamerDashboard;
