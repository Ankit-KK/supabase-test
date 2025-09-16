import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  voice_message_url?: string;
  created_at: string;
  is_hyperemote: boolean;
}

interface AlertSystemConfig {
  streamerId: string;
  tableName: string;
  pollInterval?: number;
  enabled?: boolean;
}

export const useSimpleAlerts = ({ streamerId, tableName, enabled = true }: AlertSystemConfig) => {
  const [currentAlert, setCurrentAlert] = useState<Donation | null>(null);
  const [lastShownId, setLastShownId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const showAlert = useCallback((donation: Donation, reason: string) => {
    console.log('🚨 Showing alert:', donation.name, '₹' + donation.amount, 'Reason:', reason);
    setCurrentAlert(donation);
    setIsVisible(true);
    setLastShownId(donation.id);
    setIsFirstLoad(false);

    // Auto-hide after appropriate duration
    const duration = donation.voice_message_url ? 10000 : 
                    donation.is_hyperemote ? 6000 : 5000;
    
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setCurrentAlert(null), 500); // Allow fade out
    }, duration);
  }, []);

  const fetchLatestDonation = useCallback(async () => {
    if (!enabled || !streamerId) {
      console.log(`⏸️ Alert system disabled - enabled: ${enabled}, streamerId: ${streamerId}`);
      return;
    }

    try {
      console.log(`🔄 Fetching latest from ${tableName} for streamerId: ${streamerId}`);
      
      let query;
      if (tableName === 'ankit_donations') {
        query = supabase
          .from('ankit_donations')
          .select('id, name, amount, message, voice_message_url, created_at, is_hyperemote');
      } else if (tableName === 'chia_gaming_donations') {
        query = supabase
          .from('chia_gaming_donations')
          .select('id, name, amount, message, voice_message_url, created_at, is_hyperemote');
      } else {
        query = supabase
          .from('demostreamer_donations')
          .select('id, name, amount, message, voice_message_url, created_at, is_hyperemote');
      }

      const { data, error } = await query
        .eq('streamer_id', streamerId)
        .eq('payment_status', 'success')
        .in('moderation_status', ['approved', 'auto_approved'])
        .eq('message_visible', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('❌ Error fetching donations:', error);
        setConnectionStatus('error');
        return;
      }

      setConnectionStatus('connected');

      if (!data || data.length === 0) {
        console.log('📭 No donations found');
        return;
      }

      const latestDonation = data[0] as Donation;
      console.log('📦 Latest donation:', latestDonation);
      console.log('🔍 Debug state - lastShownId:', lastShownId, 'currentAlert:', !!currentAlert, 'isFirstLoad:', isFirstLoad);

      // On first load, show the latest donation if we haven't shown any alerts yet
      if (isFirstLoad && !currentAlert) {
        showAlert(latestDonation, 'First load');
      }

    } catch (error) {
      console.error('❌ Fetch error:', error);
      setConnectionStatus('error');
    }
  }, [streamerId, tableName, lastShownId, currentAlert, enabled, isFirstLoad, showAlert]);

  // Set up real-time subscription
  useEffect(() => {
    if (!enabled || !streamerId) {
      console.log(`⏸️ Real-time not started - enabled: ${enabled}, streamerId: ${streamerId}`);
      return;
    }

    console.log(`🎯 Starting real-time alerts for ${tableName} with streamerId: ${streamerId}`);
    
    // Initial fetch for first load
    fetchLatestDonation();
    
    // Set up real-time subscription
    const channel = supabase
      .channel(`alerts-${tableName}-${streamerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: `streamer_id=eq.${streamerId}`
        },
        async (payload) => {
          console.log('🔔 Real-time event:', payload.eventType, payload.new || payload.old);
          
          // Handle INSERT (new donations) or UPDATE (status changes)
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const donation = payload.new as any;
            
            // Check if this donation should trigger an alert
            const shouldAlert = 
              donation.payment_status === 'success' &&
              (donation.moderation_status === 'approved' || donation.moderation_status === 'auto_approved') &&
              donation.message_visible === true &&
              donation.id !== lastShownId &&
              !currentAlert;
            
            if (shouldAlert) {
              const alertDonation: Donation = {
                id: donation.id,
                name: donation.name,
                amount: donation.amount,
                message: donation.message,
                voice_message_url: donation.voice_message_url,
                created_at: donation.created_at,
                is_hyperemote: donation.is_hyperemote || false
              };
              
              showAlert(alertDonation, payload.eventType === 'INSERT' ? 'New donation' : 'Donation approved');
            } else {
              console.log('⏭️ Skipping real-time alert - conditions not met or already showing');
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Real-time subscription status for ${tableName}:`, status);
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('error');
        } else if (status === 'TIMED_OUT') {
          setConnectionStatus('error');
        }
      });

    channelRef.current = channel;
    
    return () => {
      console.log(`🛑 Stopping real-time alerts for ${tableName}`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [streamerId, tableName, enabled, fetchLatestDonation, showAlert, lastShownId, currentAlert]);

  const triggerTestAlert = useCallback(() => {
    const testAlert: Donation = {
      id: `test-${Date.now()}`,
      name: 'Test Donor',
      amount: 100,
      message: 'This is a test alert! 🎉',
      created_at: new Date().toISOString(),
      is_hyperemote: false
    };
    
    console.log('🧪 Triggering test alert');
    showAlert(testAlert, 'Test alert');
  }, [showAlert]);

  const resetAlertState = useCallback(() => {
    console.log('🔄 Resetting alert state');
    setCurrentAlert(null);
    setLastShownId(null);
    setIsVisible(false);
    setIsFirstLoad(true);
  }, []);

  return {
    currentAlert,
    isVisible,
    connectionStatus,
    triggerTestAlert,
    resetAlertState
  };
};