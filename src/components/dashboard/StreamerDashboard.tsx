import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Users, TrendingUp, Clock, AlertCircle, LogOut } from 'lucide-react';
import DonationCard from './DonationCard';
import TelegramDashboard from './telegram/TelegramDashboard';
import OBSTokenManager from './OBSTokenManager';
import CSVExportButton from './CSVExportButton';
import { usePusherDashboard } from '@/hooks/usePusherDashboard';
import { usePusherConfig } from '@/hooks/usePusherConfig';
import { convertToINR } from '@/constants/currencies';


interface StreamerDashboardProps {
  streamerSlug: string;
  streamerName: string;
  brandColor?: string;
  tableName: string;
}

interface DashboardStats {
  totalRevenue: number;
  todayRevenue: number;
  totalDonations: number;
  pendingModeration: number;
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
  is_hyperemote?: boolean;
  moderation_status: string;
  payment_status: string;
  created_at: string;
  message_visible?: boolean;
  streamer_id: string;
}

const StreamerDashboard: React.FC<StreamerDashboardProps> = ({
  streamerSlug,
  streamerName,
  brandColor = '#3b82f6',
  tableName
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [streamerData, setStreamerData] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    todayRevenue: 0,
    totalDonations: 0,
    pendingModeration: 0,
    averageDonation: 0,
    topDonation: 0
  });
  const [approvedDonations, setApprovedDonations] = useState<DonationRecord[]>([]);
  const [pendingDonations, setPendingDonations] = useState<DonationRecord[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Get Pusher config from backend
  const { config: pusherConfig } = usePusherConfig(streamerSlug);
  
  // Real-time dashboard updates via Pusher
  const { connectionStatus: pusherStatus, stats: pusherStats } = usePusherDashboard({
    streamerSlug,
    pusherKey: pusherConfig?.key,
    pusherCluster: pusherConfig?.cluster,
    onNewDonation: (donation) => {
      console.log('[Dashboard] New donation via Pusher:', donation);
      // Refresh dashboard data
      setRefreshKey(prev => prev + 1);
      toast({
        title: "New Donation!",
        description: `${donation.name} donated ₹${donation.amount}`,
      });
    },
    onDonationApproved: (donationId) => {
      console.log('[Dashboard] Donation approved via Pusher:', donationId);
      setRefreshKey(prev => prev + 1);
    },
    onDonationRejected: (donationId) => {
      console.log('[Dashboard] Donation rejected via Pusher:', donationId);
      setRefreshKey(prev => prev + 1);
    },
    onStatsUpdate: (newStats) => {
      console.log('[Dashboard] Stats update via Pusher:', newStats);
      setStats(prev => ({ ...prev, ...newStats }));
    }
  });
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your dashboard.",
      });
      navigate('/auth');
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
        // Get streamer by slug
        const { data: streamer, error: streamerError } = await supabase
          .from('streamers')
          .select('*')
          .eq('streamer_slug', streamerSlug)
          .single();

        if (streamerError) throw streamerError;

        // Check if user owns this streamer or is admin
        // For the custom auth system, check if streamer has no user_id (legacy) or matches current user
        const isOwner = !streamer.user_id || streamer.user_id === user.id;
        // TODO: Add admin check here when admin system is implemented
        const isAdmin = user?.role === 'admin';

        if (!isOwner && !isAdmin) {
          console.log('Access check failed:', { 
            streamerUserId: streamer.user_id, 
            currentUserId: user.id, 
            userRole: user?.role 
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
        console.error('Error fetching streamer data:', error);
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

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      if (!streamerData?.id) return;

      try {
        // Fetch donation statistics
        const { data: donations, error } = await supabase
          .from(tableName as any)
          .select('amount, currency, created_at, moderation_status, payment_status')
          .eq('streamer_id', streamerData.id) as { data: DonationRecord[] | null, error: any };

        if (error) throw error;

        // Calculate stats
        const successfulDonations = donations?.filter(d => d.payment_status === 'success') || [];
        const pendingMod = donations?.filter(d => d.moderation_status === 'pending') || [];
        const today = new Date().toDateString();
        const todayDonations = successfulDonations.filter(d => 
          new Date(d.created_at).toDateString() === today
        );

        // Convert all amounts to INR for accurate revenue calculation
        const totalRevenue = successfulDonations.reduce((sum, d) => sum + convertToINR(parseFloat(d.amount.toString()) || 0, d.currency || 'INR'), 0);
        const todayRevenue = todayDonations.reduce((sum, d) => sum + convertToINR(parseFloat(d.amount.toString()) || 0, d.currency || 'INR'), 0);
        const amounts = successfulDonations.map(d => convertToINR(parseFloat(d.amount.toString()) || 0, d.currency || 'INR'));

        setStats({
          totalRevenue,
          todayRevenue,
          totalDonations: successfulDonations.length,
          pendingModeration: pendingMod.length,
          averageDonation: amounts.length ? totalRevenue / amounts.length : 0,
          topDonation: amounts.length ? Math.max(...amounts) : 0
        });

      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [streamerData?.id, tableName, refreshKey]);

  // Fetch approved donations
  useEffect(() => {
    const fetchApprovedDonations = async () => {
      if (!streamerData?.id) return;

      try {
        const { data, error } = await supabase
          .from(tableName as any)
          .select('*')
          .eq('streamer_id', streamerData.id)
          .eq('payment_status', 'success')
          .in('moderation_status', ['approved', 'auto_approved'])
          .order('created_at', { ascending: false })
          .limit(50) as { data: DonationRecord[] | null, error: any };

        if (error) throw error;
        setApprovedDonations(data || []);
      } catch (error) {
        console.error('Error fetching approved donations:', error);
      }
    };

    fetchApprovedDonations();
  }, [streamerData?.id, tableName, refreshKey]);

  // Fetch pending donations
  useEffect(() => {
    const fetchPendingDonations = async () => {
      if (!streamerData?.id) return;

      try {
        const { data, error } = await supabase
          .from(tableName as any)
          .select('*')
          .eq('streamer_id', streamerData.id)
          .eq('moderation_status', 'pending')
          .order('created_at', { ascending: false })
          .limit(20) as { data: DonationRecord[] | null, error: any };

        if (error) throw error;
        setPendingDonations(data || []);
      } catch (error) {
        console.error('Error fetching pending donations:', error);
      }
    };

    fetchPendingDonations();
  }, [streamerData?.id, tableName, refreshKey]);

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
              <p className="text-muted-foreground mt-1">
                Manage your donations and settings
              </p>
              <div className="flex items-center mt-2 space-x-2">
                <Badge variant="secondary">
                  🔄 Auto-refresh (30s)
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Updates every 30 seconds
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => setRefreshKey(prev => prev + 1)}>
                Refresh Data
              </Button>
              <Button variant="outline" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
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
              <p className="text-xs text-muted-foreground">
                From {stats.totalDonations} donations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.todayRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Today's earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Donation</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.averageDonation.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Per donation
              </p>
            </CardContent>
          </Card>

        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="donations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="donations">Approved Donations</TabsTrigger>
            <TabsTrigger value="telegram">Telegram Dashboard</TabsTrigger>
            <TabsTrigger value="obs">OBS Setup</TabsTrigger>
          </TabsList>

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
                  <CSVExportButton 
                    streamerId={streamerData.id}
                    tableName={tableName}
                    streamerName={streamerName}
                  />
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
                      <DonationCard 
                        key={donation.id} 
                        donation={donation} 
                        brandColor={brandColor}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="telegram" className="space-y-6 data-[state=inactive]:hidden" forceMount>
            <TelegramDashboard 
              donations={pendingDonations}
              tableName={tableName}
              onModerationAction={() => setRefreshKey(prev => prev + 1)}
              streamerId={streamerData.id}
              streamerSlug={streamerSlug}
            />
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