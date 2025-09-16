import React, { useState, useEffect, useCallback } from 'react';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useDemoStreamerAuth } from "@/hooks/useDemoStreamerAuth";
import { obsTokenCache } from '@/utils/obsTokenCache';
import { PendingDonationsBadge } from '@/components/PendingDonationsBadge';
import { 
  DollarSign, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Settings,
  LogOut,
  PlayCircle,
  MessageSquare,
  TrendingUp,
  Gift,
  Sparkles
} from "lucide-react";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  payment_status: string;
  moderation_status: string;
  is_hyperemote: boolean;
  voice_message_url: string;
  created_at: string;
}

export default function DemoStreamerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, loading, logout } = useDemoStreamerAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalDonations: 0,
    pendingDonations: 0,
    todayAmount: 0
  });
  const [streamer, setStreamer] = useState<{ id: string; streamer_slug: string; streamer_name: string; } | null>(null);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [obsToken, setObsToken] = useState<string>('');

  // Get streamer info for real-time subscription
  useEffect(() => {
    if (session?.streamerId) {
      setStreamer({
        id: session.streamerId,
        streamer_slug: 'demostreamer',
        streamer_name: session.streamerName || 'DemoStreamer'
      });
    }
  }, [session]);

  // Add real-time subscription
  const connectionState = useRealtimeSubscription({
    streamerId: streamer?.id,
    streamerSlug: 'demostreamer',
    onDonationUpdate: (payload) => {
      const newDonation = payload.new as Donation;
      
      if (payload.eventType === 'INSERT' && newDonation.payment_status === 'success') {
        toast({
          title: "💰 New Donation!",
          description: `${newDonation.name} donated ₹${newDonation.amount}`,
          duration: 4000,
        });

        // Update local state directly instead of refetching
        setDonations(prev => [newDonation, ...prev]);
        setStats(prev => ({
          ...prev,
          totalAmount: prev.totalAmount + Number(newDonation.amount),
          totalDonations: prev.totalDonations + 1,
          // Update today's earnings if it's from today
          todayAmount: new Date(newDonation.created_at).toDateString() === new Date().toDateString() 
            ? prev.todayAmount + Number(newDonation.amount)
            : prev.todayAmount
        }));
      }
      
      if (payload.eventType === 'UPDATE') {
        const oldDonation = payload.old as Donation;
        
        // Check if payment was completed
        if (oldDonation.payment_status !== 'success' && newDonation.payment_status === 'success') {
          toast({
            title: "💰 Payment Confirmed!",
            description: `${newDonation.name} - ₹${newDonation.amount}`,
            duration: 4000,
          });
        }
        
        // Check if donation was approved
        if (oldDonation.moderation_status !== 'approved' && newDonation.moderation_status === 'approved') {
          toast({
            title: "✅ Donation Approved!",
            description: `${newDonation.name}'s message is now live on OBS`,
            duration: 4000,
          });
        }

        // Update donation in local state
        setDonations(prev => prev.map(d => d.id === newDonation.id ? newDonation : d));
        
        // Update pending reviews count if moderation status changed
        if (oldDonation.moderation_status === 'pending' && newDonation.moderation_status !== 'pending') {
          setStats(prev => ({
            ...prev,
            pendingDonations: Math.max(0, prev.pendingDonations - 1)
          }));
        }
      }
    },
    enabled: !!streamer?.id
  });

  useEffect(() => {
    if (!loading && !session) {
      navigate('/demostreamer/login');
    }
  }, [session, loading, navigate]);

  useEffect(() => {
    if (session) {
      loadDonations();
    }
  }, [session]);

  const loadDonations = async () => {
    try {
      setLoadingDonations(true);
      
      if (!session?.streamerId) {
        throw new Error('No streamer ID available');
      }

      const { data, error } = await supabase
        .rpc('get_streamer_donations', { 
          p_streamer_id: session.streamerId
        });

      if (error) throw error;

      setDonations(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error loading donations:', error);
      toast({
        title: "Failed to load donations",
        description: "Please refresh the page to try again",
        variant: "destructive"
      });
    } finally {
      setLoadingDonations(false);
    }
  };

  const calculateStats = (donationsData: Donation[]) => {
    const today = new Date().toDateString();
    
    const stats = donationsData.reduce((acc, donation) => {
      if (donation.payment_status === 'success') {
        acc.totalAmount += donation.amount;
        acc.totalDonations += 1;
        
        if (new Date(donation.created_at).toDateString() === today) {
          acc.todayAmount += donation.amount;
        }
      }
      
      if (donation.moderation_status === 'pending') {
        acc.pendingDonations += 1;
      }
      
      return acc;
    }, {
      totalAmount: 0,
      totalDonations: 0,
      pendingDonations: 0,
      todayAmount: 0
    });

    setStats(stats);
  };


  useEffect(() => {
    if (!session) {
      navigate('/demostreamer/login');
      return;
    }

    loadDonations();
  }, [session]);

  const handleApproveDonation = async (donationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        'approve-donation-demostreamer',
        {
          body: {
            donation_id: donationId,
            streamer_session: session
          }
        }
      );

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Donation approved",
          description: "The donation has been approved successfully"
        });
        loadDonations();
      } else {
        throw new Error(data?.error || 'Failed to approve donation');
      }
    } catch (error) {
      console.error('Error approving donation:', error);
      toast({
        title: "Failed to approve",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleRejectDonation = async (donationId: string, reason: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        'reject-donation-demostreamer',
        {
          body: {
            donation_id: donationId,
            reason,
            streamer_session: session
          }
        }
      );

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Donation rejected",
          description: "The donation has been rejected"
        });
        loadDonations();
      } else {
        throw new Error(data?.error || 'Failed to reject donation');
      }
    } catch (error) {
      console.error('Error rejecting donation:', error);
      toast({
        title: "Failed to reject",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (donation: Donation) => {
    if (donation.payment_status !== 'success') {
      return <Badge variant="secondary">Payment {donation.payment_status}</Badge>;
    }

    switch (donation.moderation_status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'auto_approved':
        return <Badge variant="default" className="bg-blue-500">Auto Approved</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending Review</Badge>;
      default:
        return <Badge variant="secondary">{donation.moderation_status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                {session.streamerName} Dashboard
                {streamer?.id && (
                  <PendingDonationsBadge 
                    streamerId={streamer.id} 
                    tableName="demostreamer_donations" 
                  />
                )}
              </h1>
              <p className="text-gray-600">
                Welcome back! {session.isAdmin && <span className="text-purple-600">(Admin)</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/demostreamer-obs-settings')}
            >
              <Settings className="w-4 h-4 mr-2" />
              OBS Settings
            </Button>
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDonations}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.todayAmount.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingDonations}</div>
            </CardContent>
          </Card>
        </div>

        {/* Donations List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Recent Donations
            </CardTitle>
            <CardDescription>
              Manage and moderate incoming donations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingDonations ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading donations...</p>
              </div>
            ) : donations.length === 0 ? (
              <div className="text-center py-8">
                <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No donations yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {donations.map((donation) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-white/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{donation.name}</span>
                        {donation.is_hyperemote && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            Hyperemote
                          </Badge>
                        )}
                        {getStatusBadge(donation)}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        ₹{donation.amount} • {new Date(donation.created_at).toLocaleString()}
                      </p>
                      {donation.message && (
                        <p className="text-sm text-gray-800">{donation.message}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {donation.voice_message_url && (
                        <Button size="sm" variant="outline">
                          <PlayCircle className="w-4 h-4" />
                        </Button>
                      )}
                      {donation.moderation_status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApproveDonation(donation.id)}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectDonation(donation.id, 'Inappropriate content')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
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
}