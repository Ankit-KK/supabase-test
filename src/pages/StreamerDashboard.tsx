import React, { useEffect, useState } from 'react';
import { Navigate, Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStreamerAuth } from '@/hooks/useStreamerAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, calculateMonthlyTotal } from '@/utils/dashboardUtils';
import { DollarSign, TrendingUp, Users, Calendar, Settings, LogOut } from 'lucide-react';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message?: string;
  created_at: string;
  payment_status: string;
  streamer_id?: string;
  message_visible?: boolean;
}

interface Streamer {
  id: string;
  user_id: string;
  streamer_slug: string;
  streamer_name: string;
  brand_color: string;
  brand_logo_url?: string;
}

const StreamerDashboard = () => {
  const { session, loading, logout } = useStreamerAuth();
  const { streamerSlug } = useParams<{ streamerSlug: string }>();
  const [streamer, setStreamer] = useState<Streamer | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [monthlyAmount, setMonthlyAmount] = useState(0);
  const [hasAccess, setHasAccess] = useState(false);

  // Move useEffect to top level - before any conditional logic
  useEffect(() => {
    if (!session || !streamerSlug) return;

    const fetchStreamerAndData = async () => {
      setLoadingData(true);
      
      try {
        // First, get the streamer info
        const { data: streamerData, error: streamerError } = await supabase
          .from('streamers')

          .select('*')
          .eq('streamer_slug', streamerSlug)
          .single();

        if (streamerError || !streamerData) {
          console.error('Error fetching streamer:', streamerError);
          setLoadingData(false);
          return;
        }

        const streamerInfo = streamerData;
        setStreamer(streamerInfo);

        // Check if logged in user matches this streamer
        if (session.streamerSlug !== streamerSlug) {
          setHasAccess(false);
          setLoadingData(false);
          return;
        }

        setHasAccess(true);

        // Fetch donations for this streamer
        const { data: donationsData, error: donationsError } = await supabase
          .from('chia_gaming_donations')
          .select('*')
          .eq('streamer_id', streamerInfo.id)
          .eq('payment_status', 'success')
          .order('created_at', { ascending: false });

        if (donationsError) {
          console.error('Error fetching donations:', donationsError);
        } else {
          setDonations(donationsData || []);
          
          // Calculate totals
          const total = donationsData?.reduce((sum, donation) => sum + Number(donation.amount), 0) || 0;
          setTotalAmount(total);
          
          const monthly = calculateMonthlyTotal(donationsData || []);
          setMonthlyAmount(monthly);
        }
      } catch (error) {
        console.error('Error in fetchStreamerAndData:', error);
      }
      
      setLoadingData(false);
    };

    fetchStreamerAndData();

    // Set up realtime subscription for this streamer's donations
    const channel = supabase
      .channel(`donations-${streamerSlug}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chia_gaming_donations'
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new.payment_status === 'success') {
            const newDonation = payload.new as Donation;
            if (newDonation.streamer_id === streamer?.id) {
              setDonations(prev => [newDonation, ...prev]);
              setTotalAmount(prev => prev + Number(newDonation.amount));
              setMonthlyAmount(prev => {
                const donationDate = new Date(newDonation.created_at);
                const now = new Date();
                if (donationDate.getMonth() === now.getMonth() && donationDate.getFullYear() === now.getFullYear()) {
                  return prev + Number(newDonation.amount);
                }
                return prev;
              });
            }
          }
          
          if (payload.eventType === 'UPDATE' && payload.new.payment_status === 'success' && payload.old.payment_status !== 'success') {
            const updatedDonation = payload.new as Donation;
            if (updatedDonation.streamer_id === streamer?.id) {
              setDonations(prev => [updatedDonation, ...prev.filter(d => d.id !== updatedDonation.id)]);
              setTotalAmount(prev => prev + Number(updatedDonation.amount));
              setMonthlyAmount(prev => {
                const donationDate = new Date(updatedDonation.created_at);
                const now = new Date();
                if (donationDate.getMonth() === now.getMonth() && donationDate.getFullYear() === now.getFullYear()) {
                  return prev + Number(updatedDonation.amount);
                }
                return prev;
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, streamerSlug, streamer?.id]);

  // Show loading while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!streamer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Streamer Not Found</CardTitle>
            <CardDescription>The streamer "{streamerSlug}" could not be found.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this dashboard.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6"
      style={{ 
        '--brand-color': streamer.brand_color,
        '--brand-color-rgb': `hsl(${streamer.brand_color?.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(' ') || '99 102 241'})` 
      } as React.CSSProperties}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{streamer.streamer_name} Dashboard</h1>
            <p className="text-muted-foreground">Track your streaming donations in real-time</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to={`/${streamerSlug}/dashboard/obs`}>
                <Settings className="w-4 h-4 mr-2" />
                OBS Settings
              </Link>
            </Button>
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card style={{ borderColor: streamer.brand_color }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: streamer.brand_color }}>
                {formatCurrency(totalAmount)}
              </div>
              <p className="text-xs text-muted-foreground">All-time total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(monthlyAmount)}</div>
              <p className="text-xs text-muted-foreground">Current month total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{donations.length}</div>
              <p className="text-xs text-muted-foreground">Successful donations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Donation</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {donations.length > 0 ? formatCurrency(totalAmount / donations.length) : formatCurrency(0)}
              </div>
              <p className="text-xs text-muted-foreground">Per donation</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Donations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Donations</CardTitle>
            <CardDescription>Latest donations with real-time updates</CardDescription>
          </CardHeader>
          <CardContent>
            {donations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No donations yet. Share your donation link to get started!
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {donations.map((donation) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{donation.name}</span>
                        <Badge 
                          variant="secondary"
                          style={{ backgroundColor: `${streamer.brand_color}20`, color: streamer.brand_color }}
                        >
                          {formatCurrency(Number(donation.amount))}
                        </Badge>
                      </div>
                      {donation.message && (
                        <p className="text-sm text-muted-foreground mt-1">{donation.message}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {new Date(donation.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(donation.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StreamerDashboard;