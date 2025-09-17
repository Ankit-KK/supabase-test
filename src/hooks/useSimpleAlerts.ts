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
  obsToken?: string;
}

export const useSimpleAlerts = ({ streamerId, tableName, enabled = true, obsToken }: AlertSystemConfig) => {
  const [currentAlert, setCurrentAlert] = useState<Donation | null>(null);
  const [lastShownId, setLastShownId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  // Helper function to clear current alert state
  const clearCurrentAlert = useCallback(() => {
    console.log('🧹 Clearing current alert state');
    setCurrentAlert(null);
    setIsVisible(false);
  }, []);

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

  const fetchLatestDonation = useCallback(async (forceShow = false) => {
    if (!enabled || !streamerId || !obsToken) {
      console.log(`⏸️ Alert system disabled - enabled: ${enabled}, streamerId: ${streamerId}, obsToken: ${!!obsToken}`);
      return;
    }

    try {
      console.log(`🔄 Fetching latest from ${tableName} using secure RPC for streamerId: ${streamerId}`);
      
      const { data, error } = await supabase.rpc('get_alerts_for_obs_token', {
        p_obs_token: obsToken,
        p_table_name: tableName
      });

      if (error) {
        console.error('❌ RPC error:', error);
        setConnectionStatus('error');
        return;
      }

      console.log('📊 RPC query result:', data);
      setConnectionStatus('connected');

      if (!data || data.length === 0) {
        console.log('📭 No donations found matching criteria');
        return;
      }

      const latestDonation = data[0] as Donation;
      console.log('📦 Latest donation found:', {
        id: latestDonation.id,
        name: latestDonation.name,
        amount: latestDonation.amount,
        created_at: latestDonation.created_at
      });

      // On first load, just set the baseline without showing alert
      if (isFirstLoad) {
        console.log('🎯 First load - setting baseline donation ID without showing alert');
        console.log('🧹 Clearing any existing alert state on first load');
        
        // Explicitly clear alert states to prevent old alerts from showing
        clearCurrentAlert();
        setLastShownId(latestDonation.id);
        setIsFirstLoad(false);
        
        console.log('✅ First load complete - baseline set, states cleared');
        return;
      }

      // Show alert only if forced or genuinely new
      console.log('🔍 Alert decision check:', {
        latestDonationId: latestDonation.id,
        lastShownId: lastShownId,
        forceShow: forceShow,
        isDifferent: latestDonation.id !== lastShownId
      });
      
      const shouldShow = forceShow || latestDonation.id !== lastShownId;
      
      if (shouldShow) {
        console.log('🎬 Showing alert - reason:', forceShow ? 'Forced sync' : 'New donation');
        showAlert(latestDonation, forceShow ? 'Sync after reconnect' : 'New donation');
      } else {
        console.log('❌ Not showing alert - donation already shown or no force flag');
      }

    } catch (error) {
      console.error('❌ Fetch error:', error);
      setConnectionStatus('error');
    }
  }, [streamerId, tableName, enabled, isFirstLoad, lastShownId, obsToken, showAlert, clearCurrentAlert]);

  const startFallbackPolling = useCallback(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    
    console.log('🔄 Starting fallback polling due to real-time issues');
    pollIntervalRef.current = setInterval(() => {
      fetchLatestDonation(false);
    }, 5000); // Poll every 5 seconds
  }, [fetchLatestDonation]);

  const stopFallbackPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      console.log('⏹️ Stopping fallback polling');
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const setupRealtimeSubscription = useCallback(() => {
    if (!enabled || !streamerId) return;

    console.log(`🎯 Setting up real-time subscription for ${tableName} (attempt ${retryCountRef.current + 1})`);
    
    const channel = supabase
      .channel(`alerts-${tableName}-${streamerId}-${Date.now()}`)
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
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const donation = payload.new as any;
            
            const shouldAlert = 
              donation.payment_status === 'success' &&
              (donation.moderation_status === 'approved' || donation.moderation_status === 'auto_approved') &&
              donation.message_visible === true &&
              donation.id !== lastShownId;
            
            console.log('🔍 Real-time alert check:', {
              donationId: donation.id,
              paymentStatus: donation.payment_status,
              moderationStatus: donation.moderation_status,
              messageVisible: donation.message_visible,
              lastShownId: lastShownId,
              shouldAlert: shouldAlert
            });
            
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
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Real-time subscription status for ${tableName}:`, status);
        
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
          retryCountRef.current = 0;
          stopFallbackPolling();
        } else if (status === 'CHANNEL_ERROR') {
          console.log('❌ Channel error - will retry');
          setConnectionStatus('error');
          handleRealtimeFailure();
        } else if (status === 'TIMED_OUT') {
          console.log('⏱️ Connection timed out - resetting state and retrying');
          setConnectionStatus('error');
          setLastShownId(null); // Reset state on timeout
          handleRealtimeFailure();
        }
      });

    channelRef.current = channel;
  }, [streamerId, tableName, enabled, lastShownId, showAlert, stopFallbackPolling]);

  const handleRealtimeFailure = useCallback(() => {
    retryCountRef.current++;
    const maxRetries = 3;
    const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 10000);

    if (retryCountRef.current <= maxRetries) {
      console.log(`🔄 Retrying real-time connection in ${retryDelay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
      
      retryTimeoutRef.current = setTimeout(() => {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
        setupRealtimeSubscription();
      }, retryDelay);
    } else {
      console.log('🚨 Max retries exceeded, falling back to polling');
      startFallbackPolling();
      
      // Force sync after switching to polling
      setTimeout(() => fetchLatestDonation(true), 1000);
    }
  }, [setupRealtimeSubscription, startFallbackPolling, fetchLatestDonation]);

  // Set up real-time subscription
  useEffect(() => {
    if (!enabled || !streamerId) {
      console.log(`⏸️ Real-time not started - enabled: ${enabled}, streamerId: ${streamerId}`);
      return;
    }

    console.log(`🎯 Starting alerts system for ${tableName} with streamerId: ${streamerId}`);
    console.log('🧹 Ensuring clean initial state');
    
    // Ensure clean initial state on component mount
    clearCurrentAlert();
    
    // Initial fetch for first load
    fetchLatestDonation(false);
    
    // Set up real-time subscription
    setupRealtimeSubscription();
    
    return () => {
      console.log(`🛑 Stopping alerts system for ${tableName}`);
      
      // Clear all timeouts and intervals
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      stopFallbackPolling();
      
      // Remove channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      // Reset retry counter
      retryCountRef.current = 0;
    };
  }, [streamerId, tableName, enabled, fetchLatestDonation, setupRealtimeSubscription, stopFallbackPolling, clearCurrentAlert]);

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
    
    // Clear timeouts and polling
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    stopFallbackPolling();
    retryCountRef.current = 0;
  }, [stopFallbackPolling]);

  return {
    currentAlert,
    isVisible,
    connectionStatus,
    triggerTestAlert,
    resetAlertState
  };
};