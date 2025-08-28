import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNewStreamerAuth } from '@/hooks/useNewStreamerAuth';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { MessagesModerationPage } from '@/pages/MessagesModerationPage';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  LogOut,
  Settings,
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  XCircle,
  Mic
} from 'lucide-react';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string | null;
  voice_message_url: string | null;
  voice_duration_seconds: number | null;
  payment_status: string;
  moderation_status: string;
  approved_by: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
  is_hyperemote: boolean;
  message_visible: boolean;
  created_at: string;
}

interface Streamer {
  id: string;
  streamer_name: string;
  brand_color: string;
  hyperemotes_enabled: boolean;
  hyperemotes_min_amount: number;
}

const NewStreamerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { session, logout, loading } = useNewStreamerAuth();
  const [streamer, setStreamer] = useState<Streamer | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [moderationQueue, setModerationQueue] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDonations: 0,
    monthlyTotal: 0,
    pendingCount: 0,
    approvedCount: 0
  });

  useEffect(() => {
    if (!loading && !session?.isAuthenticated) {
      navigate('/newstreamer/login');
      return;
    }

    if (session?.isAuthenticated) {
      fetchData();
      setupRealtimeSubscription();
    }
  }, [session, loading, navigate]);

  const fetchData = async () => {
    try {
      // Fetch streamer data
      const { data: streamerData, error: streamerError } = await supabase
        .from('streamers')
        .select('*')
        .eq('streamer_slug', 'newstreamer')
        .single();

      if (streamerError) throw streamerError;
      setStreamer(streamerData);

      // Fetch donations
      const { data: donationsData, error: donationsError } = await supabase
        .from('newstreamer_donations')
        .select('*')
        .eq('streamer_id', streamerData.id)
        .order('created_at', { ascending: false });

      if (donationsError) throw donationsError;
      setDonations(donationsData || []);

      // Calculate stats
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyDonations = (donationsData || []).filter(d => {
        const donationDate = new Date(d.created_at);
        return donationDate.getMonth() === currentMonth && 
               donationDate.getFullYear() === currentYear &&
               d.payment_status === 'paid';
      });

      const paidDonations = (donationsData || []).filter(d => d.payment_status === 'paid');
      const pendingModeration = (donationsData || []).filter(d => 
        d.payment_status === 'paid' && d.moderation_status === 'pending'
      );
      const approvedDonations = (donationsData || []).filter(d => 
        d.moderation_status === 'approved'
      );

      setStats({
        totalDonations: paidDonations.reduce((sum, d) => sum + d.amount, 0),
        monthlyTotal: monthlyDonations.reduce((sum, d) => sum + d.amount, 0),
        pendingCount: pendingModeration.length,
        approvedCount: approvedDonations.length
      });

      setModerationQueue(pendingModeration);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('newstreamer_donations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'newstreamer_donations'
        },
        (payload) => {
          console.log('Real-time update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newDonation = payload.new as Donation;
            setDonations(prev => [newDonation, ...prev]);
            
            if (newDonation.payment_status === 'paid') {
              toast({
                title: "New Donation!",
                description: `₹${newDonation.amount} from ${newDonation.name}`,
                duration: 5000,
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedDonation = payload.new as Donation;
            setDonations(prev => 
              prev.map(d => d.id === updatedDonation.id ? updatedDonation : d)
            );
            setModerationQueue(prev => 
              prev.map(d => d.id === updatedDonation.id ? updatedDonation : d)
            );
          }
          
          // Refresh stats
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleLogout = () => {
    logout();
    navigate('/newstreamer');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!session?.isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              New Streamer Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back! Manage your donations and stream settings.
            </p>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="settings">OBS Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                      <DollarSign className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Raised</p>
                      <p className="text-2xl font-bold">₹{stats.totalDonations}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">This Month</p>
                      <p className="text-2xl font-bold">₹{stats.monthlyTotal}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold">{stats.pendingCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Approved</p>
                      <p className="text-2xl font-bold">{stats.approvedCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Donations */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Donations</CardTitle>
                <CardDescription>
                  Latest donations received on your stream
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {donations.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No donations yet. Share your donation link to get started!
                    </p>
                  ) : (
                    donations.slice(0, 10).map((donation) => (
                      <div key={donation.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(donation.moderation_status)}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{donation.name}</span>
                              <Badge variant="secondary">₹{donation.amount}</Badge>
                              {donation.is_hyperemote && (
                                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                  Hyperemote
                                </Badge>
                              )}
                              {donation.voice_message_url && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Mic className="w-3 h-3" />
                                  Voice
                                </Badge>
                              )}
                            </div>
                            {donation.message && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                {donation.message}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDateTime(donation.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={donation.payment_status === 'paid' ? 'default' : 'secondary'}
                            className={donation.payment_status === 'paid' ? 'bg-green-600' : ''}
                          >
                            {donation.payment_status}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={`
                              ${donation.moderation_status === 'approved' ? 'border-green-500 text-green-700' : ''}
                              ${donation.moderation_status === 'rejected' ? 'border-red-500 text-red-700' : ''}
                              ${donation.moderation_status === 'pending' ? 'border-yellow-500 text-yellow-700' : ''}
                            `}
                          >
                            {donation.moderation_status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <MessagesModerationPage 
              tableName="newstreamer_donations"
              streamerName="New Streamer"
              streamerSlug="newstreamer"
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ConnectionStatus />
              {streamer && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      OBS Browser Source
                    </CardTitle>
                    <CardDescription>
                      Add this URL as a browser source in OBS to display alerts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm font-mono break-all">
                        {window.location.origin}/newstreamer-alerts/demo-token
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Setup Instructions:</h4>
                      <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Copy the URL above</li>
                        <li>In OBS, add a "Browser Source"</li>
                        <li>Paste the URL and set dimensions to 800x600</li>
                        <li>Approved donations will appear as alerts!</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default NewStreamerDashboard;