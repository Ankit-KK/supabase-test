import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { toast } from '@/hooks/use-toast';
import { DollarSign, Users, TrendingUp, Settings, Eye, Clock, AlertCircle } from 'lucide-react';
import DonationCard from './DonationCard';
import RevenueChart from './RevenueChart';
import ActivityFeed from './ActivityFeed';
import ModerationQueue from './ModerationQueue';
import OBSTokenManager from './OBSTokenManager';
import SettingsPanel from './SettingsPanel';

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
  const { user, session } = useAuth();
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
  const [recentDonations, setRecentDonations] = useState<DonationRecord[]>([]);
  const [pendingDonations, setPendingDonations] = useState<DonationRecord[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Real-time subscription for live updates
  const connectionState = useRealtimeSubscription({
    streamerId: streamerData?.id,
    streamerSlug,
    onDonationUpdate: (payload) => {
      console.log('Dashboard received real-time update:', payload);
      setRefreshKey(prev => prev + 1);
      toast({
        title: "New Activity",
        description: `${payload.new?.name || 'Someone'} donated ₹${payload.new?.amount || 0}`,
      });
    },
    enabled: !!streamerData?.id
  });

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
        const isOwner = streamer.user_id === user.id;
        // TODO: Add admin check here when admin system is implemented
        const isAdmin = false;

        if (!isOwner && !isAdmin) {
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
          .select('amount, created_at, moderation_status, payment_status')
          .eq('streamer_id', streamerData.id) as { data: DonationRecord[] | null, error: any };

        if (error) throw error;

        // Calculate stats
        const successfulDonations = donations?.filter(d => d.payment_status === 'success') || [];
        const pendingMod = donations?.filter(d => d.moderation_status === 'pending') || [];
        const today = new Date().toDateString();
        const todayDonations = successfulDonations.filter(d => 
          new Date(d.created_at).toDateString() === today
        );

        const totalRevenue = successfulDonations.reduce((sum, d) => sum + (parseFloat(d.amount.toString()) || 0), 0);
        const todayRevenue = todayDonations.reduce((sum, d) => sum + (parseFloat(d.amount.toString()) || 0), 0);
        const amounts = successfulDonations.map(d => parseFloat(d.amount.toString()) || 0);

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

  // Fetch recent donations
  useEffect(() => {
    const fetchRecentDonations = async () => {
      if (!streamerData?.id) return;

      try {
        const { data, error } = await supabase
          .from(tableName as any)
          .select('*')
          .eq('streamer_id', streamerData.id)
          .eq('payment_status', 'success')
          .order('created_at', { ascending: false })
          .limit(10) as { data: DonationRecord[] | null, error: any };

        if (error) throw error;
        setRecentDonations(data || []);
      } catch (error) {
        console.error('Error fetching recent donations:', error);
      }
    };

    fetchRecentDonations();
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

  if (!user || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground">Please log in to access your dashboard.</p>
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
                <Badge variant={connectionState.status === 'connected' ? 'default' : 'secondary'}>
                  {connectionState.status === 'connected' ? '🟢 Live' : '🟡 Connecting'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Real-time updates {connectionState.status}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => setRefreshKey(prev => prev + 1)}>
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingModeration}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting moderation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="donations">Donations</TabsTrigger>
            <TabsTrigger value="moderation">Moderation</TabsTrigger>
            <TabsTrigger value="obs">OBS Setup</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart 
                streamerId={streamerData.id} 
                tableName={tableName}
                brandColor={brandColor}
              />
              <ActivityFeed 
                donations={recentDonations}
                brandColor={brandColor}
              />
            </div>
          </TabsContent>

          <TabsContent value="donations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Donations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentDonations.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No donations yet. Share your donation link to get started!
                    </p>
                  ) : (
                    recentDonations.map((donation) => (
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

          <TabsContent value="moderation" className="space-y-6">
            <ModerationQueue 
              donations={pendingDonations}
              tableName={tableName}
              onModerationAction={() => setRefreshKey(prev => prev + 1)}
            />
          </TabsContent>

          <TabsContent value="obs" className="space-y-6">
            <OBSTokenManager 
              streamerId={streamerData.id}
              streamerSlug={streamerSlug}
              brandColor={brandColor}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SettingsPanel 
              streamerData={streamerData}
              onSettingsUpdate={() => setRefreshKey(prev => prev + 1)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StreamerDashboard;