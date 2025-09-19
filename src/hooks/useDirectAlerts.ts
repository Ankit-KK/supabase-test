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

interface DirectAlertsConfig {
  streamerId: string;
  tableName: string;
  enabled?: boolean;
  obsToken?: string;
}

export const useDirectAlerts = ({ streamerId, tableName, enabled = true, obsToken }: DirectAlertsConfig) => {
  const [currentAlert, setCurrentAlert] = useState<Donation | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  // Validate OBS token once
  const validateToken = useCallback(async () => {
    if (!obsToken) {
      setTokenValid(false);
      return false;
    }

    try {
      console.log('🔑 Validating OBS token for direct alerts');
      const { data, error } = await supabase.rpc('validate_obs_token_secure', {
        token_to_check: obsToken
      });

      if (error || !data || !data[0]?.is_valid) {
        console.error('❌ Token validation failed:', error);
        setTokenValid(false);
        return false;
      }

      console.log('✅ Token validated successfully for streamer:', data[0].streamer_name);
      setTokenValid(true);
      return true;
    } catch (error) {
      console.error('❌ Token validation error:', error);
      setTokenValid(false);
      return false;
    }
  }, [obsToken]);

  // Show alert with auto-hide
  const showAlert = useCallback((donation: Donation, reason: string) => {
    console.log('🚨 Direct alert:', donation.name, '₹' + donation.amount, 'Reason:', reason);
    setCurrentAlert(donation);
    setIsVisible(true);

    // Auto-hide after appropriate duration
    const duration = donation.voice_message_url ? 10000 : 
                    donation.is_hyperemote ? 6000 : 5000;
    
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setCurrentAlert(null), 500); // Allow fade out
    }, duration);
  }, []);

  // Setup direct real-time subscription
  const setupDirectSubscription = useCallback(() => {
    if (!enabled || !streamerId || !tokenValid) {
      console.log(`⏸️ Direct subscription not started - enabled: ${enabled}, streamerId: ${streamerId}, tokenValid: ${tokenValid}`);
      return;
    }

    console.log(`🎯 Setting up direct subscription to ${tableName} for streamerId: ${streamerId}`);
    
    const channel = supabase
      .channel(`direct-alerts-${tableName}-${streamerId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: tableName,
          filter: `streamer_id=eq.${streamerId}`
        },
        (payload) => {
          console.log('🔔 New donation INSERT:', payload.new);
          const donation = payload.new as any;
          
          // Check if donation should trigger alert
          if (donation.payment_status === 'success' && 
              (donation.moderation_status === 'approved' || donation.moderation_status === 'auto_approved') &&
              donation.message_visible === true) {
            
            const alertDonation: Donation = {
              id: donation.id,
              name: donation.name,
              amount: donation.amount,
              message: donation.message || '',
              voice_message_url: donation.voice_message_url,
              created_at: donation.created_at,
              is_hyperemote: donation.is_hyperemote || false
            };
            
            showAlert(alertDonation, 'New donation');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: tableName,
          filter: `streamer_id=eq.${streamerId}`
        },
        (payload) => {
          console.log('🔔 Donation UPDATE:', payload.new);
          const donation = payload.new as any;
          const oldDonation = payload.old as any;
          
          // Only alert if moderation status changed from pending to approved
          if (donation.payment_status === 'success' && 
              donation.moderation_status === 'approved' &&
              oldDonation.moderation_status === 'pending' &&
              donation.message_visible === true) {
            
            const alertDonation: Donation = {
              id: donation.id,
              name: donation.name,
              amount: donation.amount,
              message: donation.message || '',
              voice_message_url: donation.voice_message_url,
              created_at: donation.created_at,
              is_hyperemote: donation.is_hyperemote || false
            };
            
            showAlert(alertDonation, 'Donation approved');
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Direct subscription status for ${tableName}:`, status);
        
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
          retryCountRef.current = 0;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.log(`❌ Connection issue: ${status}`);
          setConnectionStatus('error');
          handleConnectionFailure();
        } else if (status === 'CLOSED') {
          setConnectionStatus('disconnected');
        }
      });

    channelRef.current = channel;
  }, [streamerId, tableName, enabled, tokenValid, showAlert]);

  // Handle connection failures with retry logic
  const handleConnectionFailure = useCallback(() => {
    retryCountRef.current++;
    const maxRetries = 5;
    const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 10000);

    if (retryCountRef.current <= maxRetries) {
      console.log(`🔄 Retrying direct connection in ${retryDelay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
      
      retryTimeoutRef.current = setTimeout(() => {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
        setupDirectSubscription();
      }, retryDelay);
    } else {
      console.log('🚨 Max retries exceeded for direct subscription');
      setConnectionStatus('error');
    }
  }, [setupDirectSubscription]);

  // Main effect - validate token and setup subscription
  useEffect(() => {
    if (!enabled || !streamerId || !obsToken) {
      console.log(`⏸️ Direct alerts disabled - enabled: ${enabled}, streamerId: ${streamerId}, obsToken: ${!!obsToken}`);
      return;
    }

    console.log(`🎯 Initializing direct alerts for ${tableName}`);
    
    // First validate token, then setup subscription
    validateToken().then((isValid) => {
      if (isValid) {
        setupDirectSubscription();
      }
    });

    return () => {
      console.log(`🛑 Cleaning up direct alerts for ${tableName}`);
      
      // Clear retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      // Remove channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      // Reset state
      retryCountRef.current = 0;
      setConnectionStatus('connecting');
      setTokenValid(null);
    };
  }, [streamerId, tableName, enabled, obsToken, validateToken, setupDirectSubscription]);

  // Test alert function
  const triggerTestAlert = useCallback(() => {
    const testAlert: Donation = {
      id: `test-${Date.now()}`,
      name: 'Test Donor',
      amount: 100,
      message: 'This is a direct test alert! 🎉',
      created_at: new Date().toISOString(),
      is_hyperemote: false
    };
    
    console.log('🧪 Triggering direct test alert');
    showAlert(testAlert, 'Test alert');
  }, [showAlert]);

  return {
    currentAlert,
    isVisible,
    connectionStatus,
    triggerTestAlert,
    tokenValid
  };
};