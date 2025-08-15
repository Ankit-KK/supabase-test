import React, { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, calculateMonthlyTotal } from '@/utils/dashboardUtils';
import { DollarSign, TrendingUp, Users, Calendar } from 'lucide-react';

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

const Dashboard = () => {
  const { user, loading, isStreamer } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [monthlyAmount, setMonthlyAmount] = useState(0);

  console.log('Dashboard: Render start', { user: !!user, loading, isStreamer });

  // Show loading while auth is being determined
  if (loading) {
    console.log('Dashboard: Showing loading state - auth loading');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    console.log('Dashboard: Redirecting to auth - no user');
    return <Navigate to="/auth" replace />;
  }

  // For now, allow access even if not a streamer (since field might not exist)
  // TODO: Enforce streamer requirement after proper migration
  if (!isStreamer) {
    console.log('Dashboard: User is not a streamer, but allowing access for demo');
  }

  useEffect(() => {
    if (!user) {
      console.log('Dashboard: No user, skipping data fetch');
      return;
    }

    console.log('Dashboard: Fetching donations for user', user.id);

    const fetchDonations = async () => {
      setLoadingDonations(true);
      
      try {
        const { data, error } = await supabase
          .from('chia_gaming_donations')
          .select('*')
          .eq('payment_status', 'success')
          .order('created_at', { ascending: false });

        console.log('Dashboard: Donations fetched', { count: data?.length, error });

        if (error) {
          console.error('Error fetching donations:', error);
        } else {
          setDonations(data || []);
          
          // Calculate totals
          const total = data?.reduce((sum, donation) => sum + Number(donation.amount), 0) || 0;
          setTotalAmount(total);
          
          const monthly = calculateMonthlyTotal(data || []);
          setMonthlyAmount(monthly);
          
          console.log('Dashboard: Totals calculated', { total, monthly });
        }
      } catch (error) {
        console.error('Dashboard: Error in fetchDonations', error);
      }
      
      setLoadingDonations(false);
    };

    fetchDonations();

    // Set up realtime subscription
    console.log('Dashboard: Setting up realtime subscription');
    const channel = supabase
      .channel('donations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chia_gaming_donations'
        },
        (payload) => {
          console.log('Dashboard: Donation update received:', payload);
          
          if (payload.eventType === 'INSERT' && payload.new.payment_status === 'success') {
            const newDonation = payload.new as Donation;
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
          
          if (payload.eventType === 'UPDATE' && payload.new.payment_status === 'success' && payload.old.payment_status !== 'success') {
            const updatedDonation = payload.new as Donation;
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
      )
      .subscribe();

    return () => {
      console.log('Dashboard: Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loadingDonations) {
    console.log('Dashboard: Showing loading state - donations loading');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  console.log('Dashboard: Rendering main content', { donationsCount: donations.length });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Donation Dashboard</h1>
            <p className="text-muted-foreground">Track your streaming donations in real-time</p>
          </div>
          <Button asChild>
            <Link to="/dashboard/obs">OBS Settings</Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
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
                        <Badge variant="secondary">{formatCurrency(Number(donation.amount))}</Badge>
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

export default Dashboard;