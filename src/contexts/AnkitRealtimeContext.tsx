import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, calculateMonthlyTotal } from '@/utils/dashboardUtils';

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

interface AnkitRealtimeState {
  // Data
  streamer: Streamer | null;
  donations: Donation[];
  moderationDonations: Donation[];
  totalAmount: number;
  monthlyAmount: number;
  
  // Status
  loading: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  
  // Actions
  refreshData: () => Promise<void>;
  approveDonation: (donationId: string) => Promise<void>;
  rejectDonation: (donationId: string, reason?: string) => Promise<void>;
}

const AnkitRealtimeContext = createContext<AnkitRealtimeState | null>(null);

export const useAnkitRealtime = () => {
  const context = useContext(AnkitRealtimeContext);
  if (!context) {
    throw new Error('useAnkitRealtime must be used within AnkitRealtimeProvider');
  }
  return context;
};

interface AnkitRealtimeProviderProps {
  children: React.ReactNode;
  session: any;
}

export const AnkitRealtimeProvider: React.FC<AnkitRealtimeProviderProps> = ({ children, session }) => {
  const { toast } = useToast();
  const [streamer, setStreamer] = useState<Streamer | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [moderationDonations, setModerationDonations] = useState<Donation[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [monthlyAmount, setMonthlyAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  const subscriptionRef = useRef<any>(null);
  const isInitialized = useRef(false);

  // Initial data fetch
  const refreshData = useCallback(async () => {
    if (!session?.streamerId) return;
    
    console.log('🔄 [AnkitRealtime] Refreshing data for streamer:', session.streamerId);
    setLoading(true);
    
    try {
      // Get streamer info
      const { data: streamerData, error: streamerError } = await supabase
        .rpc('get_public_streamer_info', { slug: 'ankit' });

      if (streamerError || !streamerData?.[0]) {
        console.error('❌ [AnkitRealtime] Error fetching streamer:', streamerError);
        return;
      }

      const streamerInfo = streamerData[0];
      setStreamer(streamerInfo);

      // Fetch all donations
      const { data: donationsData, error: donationsError } = await supabase
        .rpc('get_ankit_donations', { p_streamer_id: streamerInfo.id });

      // Fetch moderation donations
      const { data: moderationData, error: moderationError } = await supabase
        .rpc('get_ankit_moderation_donations', { p_streamer_id: streamerInfo.id });

      if (donationsError) {
        console.error('❌ [AnkitRealtime] Error fetching donations:', donationsError);
      } else {
        console.log('✅ [AnkitRealtime] Loaded donations:', donationsData?.length);
        setDonations(donationsData || []);
        
        // Calculate totals
        const total = donationsData?.reduce((sum, donation) => sum + Number(donation.amount), 0) || 0;
        setTotalAmount(total);
        
        const monthly = calculateMonthlyTotal(donationsData || []);
        setMonthlyAmount(monthly);
      }

      if (moderationError) {
        console.error('❌ [AnkitRealtime] Error fetching moderation donations:', moderationError);
      } else {
        console.log('✅ [AnkitRealtime] Loaded moderation donations:', moderationData?.length);
        setModerationDonations(moderationData || []);
      }

    } catch (error) {
      console.error('❌ [AnkitRealtime] Error in refreshData:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.streamerId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!streamer?.id) return;

    console.log('🔗 [AnkitRealtime] Setting up subscription for streamer:', streamer.id);
    setConnectionStatus('connecting');

    const channel = supabase
      .channel(`ankit-realtime-${streamer.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ankit_donations',
          filter: `streamer_id=eq.${streamer.id}`
        },
        (payload) => {
          console.log('📊 [AnkitRealtime] Real-time update:', {
            eventType: payload.eventType,
            donationId: (payload.new as any)?.id,
            donorName: (payload.new as any)?.name,
            amount: (payload.new as any)?.amount,
            paymentStatus: (payload.new as any)?.payment_status,
            moderationStatus: (payload.new as any)?.moderation_status,
          });

          const newDonation = payload.new as Donation;
          const oldDonation = payload.old as Donation;

          if (payload.eventType === 'INSERT') {
            console.log('➕ [AnkitRealtime] New donation inserted:', newDonation.name, newDonation.amount);
            
            // Add to moderation list if pending
            if (newDonation.moderation_status === 'pending') {
              setModerationDonations(prev => [newDonation, ...prev]);
            }

            // Add to main donations list if payment successful
            if (newDonation.payment_status === 'success') {
              toast({
                title: "💰 New Donation!",
                description: `${newDonation.name} donated ₹${newDonation.amount}`,
                duration: 4000,
              });

              setDonations(prev => [newDonation, ...prev]);
              setTotalAmount(prev => prev + Number(newDonation.amount));
              
              // Update monthly total if it's from this month
              const donationDate = new Date(newDonation.created_at);
              const now = new Date();
              if (donationDate.getMonth() === now.getMonth() && donationDate.getFullYear() === now.getFullYear()) {
                setMonthlyAmount(prev => prev + Number(newDonation.amount));
              }
            }
          }

          if (payload.eventType === 'UPDATE') {
            console.log('🔄 [AnkitRealtime] Donation updated:', {
              name: newDonation.name,
              paymentChanged: oldDonation?.payment_status !== newDonation.payment_status,
              moderationChanged: oldDonation?.moderation_status !== newDonation.moderation_status
            });

            // Handle payment confirmation
            if (oldDonation?.payment_status !== 'success' && newDonation.payment_status === 'success') {
              toast({
                title: "💰 Payment Confirmed!",
                description: `${newDonation.name} - ₹${newDonation.amount}`,
                duration: 4000,
              });
              
              setTotalAmount(prev => prev + Number(newDonation.amount));
              const donationDate = new Date(newDonation.created_at);
              const now = new Date();
              if (donationDate.getMonth() === now.getMonth() && donationDate.getFullYear() === now.getFullYear()) {
                setMonthlyAmount(prev => prev + Number(newDonation.amount));
              }
            }

            // Handle moderation status changes
            if (oldDonation?.moderation_status !== newDonation.moderation_status) {
              if (newDonation.moderation_status === 'approved' || newDonation.moderation_status === 'auto_approved') {
                toast({
                  title: "✅ Donation Approved!",
                  description: `${newDonation.name}'s message is now live on OBS`,
                  duration: 4000,
                });
              } else if (newDonation.moderation_status === 'rejected') {
                toast({
                  title: "❌ Donation Rejected",
                  description: `${newDonation.name}'s message was rejected`,
                  duration: 3000,
                });
              }
            }

            // Update both lists in real-time
            setDonations(prev => prev.map(d => d.id === newDonation.id ? newDonation : d));
            setModerationDonations(prev => prev.map(d => d.id === newDonation.id ? newDonation : d));
          }
        }
      )
      .subscribe((status) => {
        console.log('🔗 [AnkitRealtime] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
          console.log('✅ [AnkitRealtime] Real-time connection established!');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error('❌ [AnkitRealtime] Subscription failed:', status);
          setConnectionStatus('disconnected');
        }
      });

    subscriptionRef.current = channel;

    return () => {
      console.log('🔌 [AnkitRealtime] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [streamer?.id, toast]);

  // Initialize data on session change
  useEffect(() => {
    if (session?.streamerId && !isInitialized.current) {
      isInitialized.current = true;
      refreshData();
    }
  }, [session?.streamerId, refreshData]);

  // Moderation actions
  const approveDonation = useCallback(async (donationId: string) => {
    console.log('✅ [AnkitRealtime] Approving donation:', donationId);
    
    try {
      const { error } = await supabase.functions.invoke('approve-donation-ankit', {
        body: { 
          donation_id: donationId,
          streamer_session: session 
        }
      });

      if (error) throw error;

      toast({
        title: "Donation Approved",
        description: "The donation will now appear in OBS alerts",
      });
      
      // Real-time update will handle the state changes
      
    } catch (error) {
      console.error('❌ [AnkitRealtime] Error approving donation:', error);
      toast({
        title: "Error",
        description: "Failed to approve donation",
        variant: "destructive",
      });
    }
  }, [session, toast]);

  const rejectDonation = useCallback(async (donationId: string, reason?: string) => {
    console.log('❌ [AnkitRealtime] Rejecting donation:', donationId);
    
    try {
      const { error } = await supabase.functions.invoke('reject-donation-ankit', {
        body: { 
          donation_id: donationId, 
          reason: reason || 'Inappropriate content',
          streamer_session: session
        }
      });

      if (error) throw error;

      toast({
        title: "Donation Rejected",
        description: "The donation has been rejected and will not appear in OBS",
      });
      
      // Real-time update will handle the state changes
      
    } catch (error) {
      console.error('❌ [AnkitRealtime] Error rejecting donation:', error);
      toast({
        title: "Error",
        description: "Failed to reject donation",
        variant: "destructive",
      });
    }
  }, [session, toast]);

  const value: AnkitRealtimeState = {
    streamer,
    donations,
    moderationDonations,
    totalAmount,
    monthlyAmount,
    loading,
    connectionStatus,
    refreshData,
    approveDonation,
    rejectDonation,
  };

  return (
    <AnkitRealtimeContext.Provider value={value}>
      {children}
    </AnkitRealtimeContext.Provider>
  );
};