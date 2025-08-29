import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useChiaAuth } from '@/hooks/useChiaAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MessagesModerationPage } from './MessagesModerationPage';
import { OBSSettings } from '@/components/OBSSettings';
import { Loader2, DollarSign, Users, TrendingUp, Calendar } from 'lucide-react';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string | null;
  voice_message_url: string | null;
  payment_status: string;
  moderation_status: string;
  created_at: string;
  streamer_id: string;
  temp_voice_data: string | null;
  last_verification_attempt: string | null;
  rejected_reason: string | null;
  is_hyperemote: boolean | null;
}

const ChiaaGamingDashboard: React.FC = () => {
  const { session, loading: authLoading, logout } = useChiaAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [moderationQueue, setModerationQueue] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [streamerData, setStreamerData] = useState({
    id: 'chia_gaming',
    streamer_slug: 'chia_gaming',
    streamer_name: 'Chiaa Gaming',
    brand_color: '#8B5CF6'
  });
  const [stats, setStats] = useState({
    totalDonations: 0,
    monthlyTotal: 0,
    totalDonors: 0,
    averageDonation: 0
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!session) {
      navigate('/chiaa_gaming/login');
      return;
    }

    fetchDonations();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('chia-donations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chia_gaming_donations'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newDonation = payload.new as Donation;
            setDonations(prev => [newDonation, ...prev]);
            if (newDonation.moderation_status === 'pending') {
              setModerationQueue(prev => [newDonation, ...prev]);
            }
            toast.success(`New donation: ₹${newDonation.amount} from ${newDonation.name}`);
          } else if (payload.eventType === 'UPDATE') {
            const updatedDonation = payload.new as Donation;
            setDonations(prev => prev.map(d => d.id === updatedDonation.id ? updatedDonation : d));
            setModerationQueue(prev => prev.filter(d => d.id !== updatedDonation.id));
            
            if (updatedDonation.moderation_status === 'approved') {
              toast.success(`Donation approved: ₹${updatedDonation.amount} from ${updatedDonation.name}`);
            }
          }
          calculateStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, authLoading, navigate]);

  const fetchDonations = async () => {
    try {
      const { data, error } = await supabase
        .from('chia_gaming_donations')
        .select('*')
        .eq('streamer_id', 'chia_gaming')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDonations(data || []);
      setModerationQueue(data?.filter(d => d.moderation_status === 'pending') || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching donations:', error);
      toast.error('Failed to fetch donations');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (donationData?: Donation[]) => {
    const data = donationData || donations;
    const approvedDonations = data.filter(d => d.moderation_status === 'approved');
    
    const totalAmount = approvedDonations.reduce((sum, d) => sum + d.amount, 0);
    const uniqueDonors = new Set(approvedDonations.map(d => d.name)).size;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyDonations = approvedDonations.filter(d => {
      const donationDate = new Date(d.created_at);
      return donationDate.getMonth() === currentMonth && donationDate.getFullYear() === currentYear;
    });
    const monthlyTotal = monthlyDonations.reduce((sum, d) => sum + d.amount, 0);
    
    setStats({
      totalDonations: totalAmount,
      monthlyTotal,
      totalDonors: uniqueDonors,
      averageDonation: uniqueDonors > 0 ? Math.round(totalAmount / uniqueDonors) : 0
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/chiaa_gaming');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Chiaa Gaming Dashboard</h1>
              <p className="text-muted-foreground">Manage your donations and settings</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="moderation">
              Moderation
              {moderationQueue.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {moderationQueue.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="obs">OBS Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{stats.totalDonations.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Month</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{stats.monthlyTotal.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDonors}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Donation</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{stats.averageDonation}</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Donations */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Donations</CardTitle>
              </CardHeader>
              <CardContent>
                {donations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No donations yet. Share your donation link to start receiving donations!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {donations.slice(0, 10).map((donation) => (
                      <div key={donation.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{donation.name}</span>
                            <Badge variant={donation.moderation_status === 'approved' ? 'default' : 
                                          donation.moderation_status === 'pending' ? 'secondary' : 'destructive'}>
                              {donation.moderation_status}
                            </Badge>
                            {donation.is_hyperemote && <Badge variant="outline">Hyperemote</Badge>}
                            {donation.voice_message_url && <Badge variant="outline">Voice</Badge>}
                          </div>
                          {donation.message && (
                            <p className="text-sm text-muted-foreground mt-1">{donation.message}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(donation.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">₹{donation.amount}</div>
                          <Badge variant={donation.payment_status === 'success' ? 'default' : 'secondary'}>
                            {donation.payment_status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation">
            <MessagesModerationPage />
          </TabsContent>

          <TabsContent value="obs">
            <OBSSettings 
              streamer={streamerData} 
              onStreamerUpdate={(updated) => setStreamerData(updated)} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ChiaaGamingDashboard;