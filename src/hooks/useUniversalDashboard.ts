import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalDonations: number;
  pendingDonations: number;
  approvedDonations: number;
  totalAmount: number;
  monthlyAmount: number;
}

interface Donation {
  id: string;
  name: string;
  amount: number;
  message?: string | null;
  voice_message_url?: string | null;
  moderation_status: string;
  payment_status: string;
  is_hyperemote: boolean;
  created_at: string;
  message_visible: boolean;
}

export const useUniversalDashboard = (streamerId: string, streamerSlug: string) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalDonations: 0,
    pendingDonations: 0,
    approvedDonations: 0,
    totalAmount: 0,
    monthlyAmount: 0,
  });
  const [obsToken, setObsToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Determine which table to use based on streamer slug
  const getTableName = (slug: string) => {
    const tableMap: Record<string, string> = {
      'ankit': 'ankit_donations',
      'chia_gaming': 'chia_gaming_donations',
      'demostreamer': 'demostreamer_donations',
      'techgamer': 'techgamer_donations',
      'musicstream': 'musicstream_donations',
      'codelive': 'codelive_donations',
      'artcreate': 'artcreate_donations',
      'fitnessflow': 'fitnessflow_donations'
    };
    return tableMap[slug] || 'demostreamer_donations';
  };

  const fetchDashboardData = async () => {
    if (!streamerId || !streamerSlug) return;
    
    try {
      setLoading(true);
      const tableName = getTableName(streamerSlug);

      // Fetch recent donations using RPC function for cross-table access
      const { data: donationData, error: donationError } = await supabase
        .rpc('get_alerts_donations', {
          p_obs_token: 'dummy_token', // We'll use streamer_id filter instead
          p_table_name: tableName
        })
        .eq('streamer_id', streamerId)
        .limit(50);

      if (donationError) {
        console.error('Error fetching donations:', donationError);
        toast({
          title: "Error",
          description: "Failed to load donations",
          variant: "destructive"
        });
        return;
      }

      setDonations(donationData || []);

      // Calculate statistics
      const successfulDonations = donationData?.filter(d => d.payment_status === 'success') || [];
      const pendingCount = donationData?.filter(d => d.moderation_status === 'pending').length || 0;
      const approvedCount = donationData?.filter(d => 
        d.moderation_status === 'approved' || d.moderation_status === 'auto_approved'
      ).length || 0;
      
      const totalAmount = successfulDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
      
      // Calculate monthly amount (current month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyAmount = successfulDonations
        .filter(d => {
          const donationDate = new Date(d.created_at);
          return donationDate.getMonth() === currentMonth && donationDate.getFullYear() === currentYear;
        })
        .reduce((sum, d) => sum + (d.amount || 0), 0);

      setStats({
        totalDonations: successfulDonations.length,
        pendingDonations: pendingCount,
        approvedDonations: approvedCount,
        totalAmount,
        monthlyAmount,
      });

      // Fetch OBS token
      const { data: tokenData } = await supabase
        .from('obs_tokens')
        .select('token')
        .eq('streamer_id', streamerId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (tokenData) {
        setObsToken(tokenData.token);
      }

    } catch (error: any) {
      console.error('Dashboard data fetch error:', error);
      toast({
        title: "Error", 
        description: error.message || "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const approveDonation = async (donationId: string) => {
    try {
      const tableName = getTableName(streamerSlug);
      
      const { error } = await supabase.functions.invoke('approve-donation-universal', {
        body: {
          donation_id: donationId,
          table_name: tableName,
          streamer_slug: streamerSlug
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Donation approved successfully"
      });

      // Refresh data
      await fetchDashboardData();
    } catch (error: any) {
      console.error('Error approving donation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve donation",
        variant: "destructive"
      });
    }
  };

  const rejectDonation = async (donationId: string, reason?: string) => {
    try {
      const tableName = getTableName(streamerSlug);
      
      const { error } = await supabase.functions.invoke('reject-donation-universal', {
        body: {
          donation_id: donationId,
          table_name: tableName,
          streamer_slug: streamerSlug,
          reason
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Donation rejected successfully"
      });

      // Refresh data
      await fetchDashboardData();
    } catch (error: any) {
      console.error('Error rejecting donation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject donation",
        variant: "destructive"
      });
    }
  };

  const regenerateObsToken = async () => {
    try {
      const newToken = `obs_${streamerId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase.rpc('regenerate_obs_token', {
        p_streamer_id: streamerId,
        p_new_token: newToken
      });

      if (error) throw error;

      setObsToken(newToken);
      toast({
        title: "Success",
        description: "OBS token regenerated successfully"
      });
    } catch (error: any) {
      console.error('Error regenerating OBS token:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate OBS token",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (streamerId && streamerSlug) {
      fetchDashboardData();
    }
  }, [streamerId, streamerSlug]);

  return {
    donations,
    stats,
    obsToken,
    loading,
    fetchDashboardData,
    approveDonation,
    rejectDonation,
    regenerateObsToken
  };
};