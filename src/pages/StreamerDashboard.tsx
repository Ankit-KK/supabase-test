import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useChiaAuth } from '@/hooks/useChiaAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, calculateMonthlyTotal } from '@/utils/dashboardUtils';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, TrendingUp, Users, Calendar, LogOut, Settings } from 'lucide-react';
import OBSSettings from '@/components/OBSSettings';
import { MessagesModerationPage } from './MessagesModerationPage';
import { ConnectionStatus } from '@/components/ConnectionStatus';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message?: string | null;
  voice_message_url?: string | null;
  moderation_status: string;
  approved_by?: string | null;
  approved_at?: string | null;
  rejected_reason?: string | null;
  created_at: string;
  is_hyperemote?: boolean | null;
  payment_status?: string | null;
  streamer_id?: string;
  message_visible?: boolean;
}

interface Streamer {
  id: string;
  streamer_slug: string;
  streamer_name: string;
  brand_color: string;
  brand_logo_url?: string;
  hyperemotes_enabled?: boolean;
  hyperemotes_min_amount?: number;
}

const StreamerDashboard = () => {
  const { session, loading, logout } = useChiaAuth();
  const streamerSlug = 'chia_gaming';
  const { toast } = useToast();
  const [streamer, setStreamer] = useState<Streamer | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [moderationDonations, setModerationDonations] = useState<Donation[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [monthlyAmount, setMonthlyAmount] = useState(0);
  const [hasAccess, setHasAccess] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleStreamerUpdate = (updatedStreamer: Streamer) => {
    setStreamer(updatedStreamer);
  };

  const refreshModerationData = async () => {
    if (!streamer?.id) return;
    
    console.log('Refreshing moderation data for streamer:', streamer.id);
    try {
      const { data: moderationData, error } = await supabase
        .rpc('get_streamer_moderation_donations', { 
          p_streamer_id: streamer.id
        });

      if (!error) {
        console.log('Fetched moderation data:', moderationData?.length, 'donations');
        setModerationDonations(moderationData || []);
      } else {
        console.error('Error fetching moderation data:', error);
      }
    } catch (error) {
      console.error('Error refreshing moderation data:', error);
    }
  };

  // Move useEffect to top level - before any conditional logic
  useEffect(() => {
    if (!session) return;

    const fetchStreamerAndData = async () => {
      setLoadingData(true);
      
      try {
        // First, get the streamer info using secure function to bypass RLS
        const { data: streamerData, error: streamerError } = await supabase
          .rpc('get_public_streamer_info', { slug: streamerSlug });

        if (streamerError || !streamerData || streamerData.length === 0) {
          console.error('Error fetching streamer:', streamerError);
          setLoadingData(false);
          return;
        }

        const streamerInfo = streamerData[0];
        setStreamer(streamerInfo);

        // Check if logged in user matches this streamer
        if (session.streamerSlug !== streamerSlug) {
          setHasAccess(false);
          setLoadingData(false);
          return;
        }

        setHasAccess(true);

        // Fetch donations for this streamer using secure function
        const { data: donationsData, error: donationsError } = await supabase
          .rpc('get_streamer_donations', { 
            p_streamer_id: streamerInfo.id
          });

        // Fetch donations for moderation using secure function
        const { data: moderationData, error: moderationError } = await supabase
          .rpc('get_streamer_moderation_donations', { 
            p_streamer_id: streamerInfo.id
          });

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

        if (moderationError) {
          console.error('Error fetching moderation donations:', moderationError);
        } else {
          setModerationDonations(moderationData || []);
        }
      } catch (error) {
        console.error('Error in fetchStreamerAndData:', error);
      }
      
      setLoadingData(false);
    };

    fetchStreamerAndData();
  }, [session]);

  // Separate useEffect for realtime subscription to avoid dependency issues
  useEffect(() => {
    if (!streamer?.id) return;

    // Set up realtime subscription for this streamer's donations
    const channel = supabase
      .channel(`donations-${streamer.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chia_gaming_donations',
          filter: `streamer_id=eq.${streamer.id}`
        },
        (payload) => {
          console.log('Realtime donation update:', payload);
          
          if (payload.eventType === 'INSERT' && payload.new.payment_status === 'success') {
            const newDonation = payload.new as Donation;
            
            // Update dashboard donations if approved/auto-approved
            if (newDonation.moderation_status === 'approved' || newDonation.moderation_status === 'auto_approved') {
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
              
              // Show notification for new donation
              toast({
                title: "New Donation! 🎉",
                description: `${newDonation.name} donated ${formatCurrency(Number(newDonation.amount))}${newDonation.message ? `: ${newDonation.message}` : ''}`,
                duration: 5000,
              });
            }

            // Update moderation donations if not auto-approved or if it's a new pending donation
            if (newDonation.moderation_status === 'pending' && !newDonation.is_hyperemote) {
              setModerationDonations(prev => [newDonation, ...prev]);
            }
          }
          
          if (payload.eventType === 'UPDATE') {
            const updatedDonation = payload.new as Donation;
            const oldDonation = payload.old as Donation;
            
            // Handle approval/rejection updates for dashboard
            if (oldDonation.moderation_status === 'pending' && 
                (updatedDonation.moderation_status === 'approved' || updatedDonation.moderation_status === 'auto_approved')) {
              // Donation was approved - add to dashboard
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
              
              toast({
                title: "Donation Approved! ✅",
                description: `${updatedDonation.name}'s donation is now live`,
                duration: 5000,
              });
            } else if ((oldDonation.moderation_status === 'approved' || oldDonation.moderation_status === 'auto_approved') && 
                       updatedDonation.moderation_status === 'rejected') {
              // Donation was rejected - remove from dashboard
              setDonations(prev => prev.filter(d => d.id !== updatedDonation.id));
              setTotalAmount(prev => prev - Number(updatedDonation.amount));
              setMonthlyAmount(prev => {
                const donationDate = new Date(updatedDonation.created_at);
                const now = new Date();
                if (donationDate.getMonth() === now.getMonth() && donationDate.getFullYear() === now.getFullYear()) {
                  return prev - Number(updatedDonation.amount);
                }
                return prev;
              });
            }

            // Update moderation donations for any successful payment that's not auto-approved
            if (updatedDonation.payment_status === 'success' && updatedDonation.moderation_status !== 'auto_approved') {
              setModerationDonations(prev => {
                const exists = prev.some(d => d.id === updatedDonation.id);
                return exists 
                  ? prev.map(d => d.id === updatedDonation.id ? updatedDonation : d)
                  : [updatedDonation, ...prev];
              });
            } else if (updatedDonation.moderation_status === 'approved' || updatedDonation.moderation_status === 'rejected' || updatedDonation.payment_status !== 'success') {
              setModerationDonations(prev => prev.filter(d => d.id !== updatedDonation.id));
            }
            
            // Handle payment status updates
            if (updatedDonation.payment_status === 'success' && oldDonation.payment_status !== 'success' &&
                (updatedDonation.moderation_status === 'approved' || updatedDonation.moderation_status === 'auto_approved')) {
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
              
              toast({
                title: "Payment Confirmed! ✅",
                description: `${updatedDonation.name} donated ${formatCurrency(Number(updatedDonation.amount))}`,
                duration: 5000,
              });
            }
          }
          
          if (payload.eventType === 'DELETE') {
            const deletedDonation = payload.old as Donation;
            setDonations(prev => prev.filter(d => d.id !== deletedDonation.id));
            setModerationDonations(prev => prev.filter(d => d.id !== deletedDonation.id));
            setTotalAmount(prev => prev - Number(deletedDonation.amount));
            setMonthlyAmount(prev => {
              const donationDate = new Date(deletedDonation.created_at);
              const now = new Date();
              if (donationDate.getMonth() === now.getMonth() && donationDate.getFullYear() === now.getFullYear()) {
                return prev - Number(deletedDonation.amount);
              }
              return prev;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamer?.id]);

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
    return <Navigate to="/chiaa_gaming/login" replace />;
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
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="obs" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              OBS Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 mt-6">

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
                        {donation.is_hyperemote && (
                          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                            🎉 Hyperemote
                          </Badge>
                        )}
                      </div>
                      {donation.message && !donation.is_hyperemote && (
                        <p className="text-sm text-muted-foreground mt-1">{donation.message}</p>
                      )}
                      {donation.is_hyperemote && (
                        <p className="text-sm text-purple-600 italic mt-1">Celebration only - no message</p>
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
          </TabsContent>

          <TabsContent value="messages" className="mt-6">
            <MessagesModerationPage 
              donations={moderationDonations}
              onRefresh={refreshModerationData}
              session={session && streamer?.id ? {
                streamerId: streamer.id,
                streamerSlug: session.streamerSlug,
                streamerName: session.streamerName,
                brandColor: session.brandColor,
                loginTime: session.loginTime || Date.now()
              } : null}
            />
          </TabsContent>

          <TabsContent value="obs" className="mt-6">
            <OBSSettings 
              streamer={streamer} 
              onStreamerUpdate={handleStreamerUpdate}
            />
          </TabsContent>
        </Tabs>
      </div>
      <ConnectionStatus />
    </div>
  );
};

export default StreamerDashboard;