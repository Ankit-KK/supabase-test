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
  const alertedDonationsRef = useRef<Set<string>>(new Set());

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

    // Calculate typing duration (50ms per character, only for text messages without voice)
    const typingDuration = donation.voice_message_url ? 0 : 
                          (donation.message?.length || 0) * 50;
    
    // Base duration + typing duration to ensure message completes
    const baseDuration = donation.voice_message_url ? 10000 : 
                        donation.is_hyperemote ? 6000 : 5000;
    
    const totalDuration = baseDuration + typingDuration;
    
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setCurrentAlert(null), 500); // Allow fade out
    }, totalDuration);
  }, []);

  // Setup direct real-time subscription
  const setupDirectSubscription = useCallback((isTokenValid?: boolean) => {
    const tokenIsValid = isTokenValid !== undefined ? isTokenValid : tokenValid === true;
    
    if (!enabled || !streamerId || !tokenIsValid) {
      console.log(`⏸️ Direct subscription not started - enabled: ${enabled}, streamerId: ${streamerId}, tokenValid: ${tokenIsValid}`);
      return;
    }

    // Prevent multiple subscriptions
    if (channelRef.current) {
      console.log('🔄 Channel already exists, skipping duplicate subscription');
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
          
          // Check if already alerted
          if (alertedDonationsRef.current.has(donation.id)) {
            console.log('⏭️ INSERT: Donation already alerted, skipping:', donation.id);
            return;
          }
          
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
            
            alertedDonationsRef.current.add(donation.id);
            showAlert(alertDonation, 'New donation');
          } else {
            console.log('🚫 INSERT: Donation filtered out:', {
              id: donation.id,
              payment_status: donation.payment_status,
              moderation_status: donation.moderation_status,
              message_visible: donation.message_visible
            });
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
          
          // Check if already alerted
          if (alertedDonationsRef.current.has(donation.id)) {
            console.log('⏭️ UPDATE: Donation already alerted, skipping:', donation.id);
            return;
          }
          
          // Alert if donation becomes approved/auto_approved and meets all criteria
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
            
            alertedDonationsRef.current.add(donation.id);
            showAlert(alertDonation, 'Donation approved');
          } else {
            console.log('🚫 UPDATE: Donation filtered out:', {
              id: donation.id,
              payment_status: donation.payment_status,
              moderation_status: donation.moderation_status,
              old_moderation_status: oldDonation?.moderation_status,
              message_visible: donation.message_visible,
              already_alerted: alertedDonationsRef.current.has(donation.id)
            });
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
    const maxRetries = 3; // Reduced retries to prevent excessive CPU usage
    const retryDelay = Math.min(2000 * Math.pow(2, retryCountRef.current - 1), 15000); // Increased delays

    if (retryCountRef.current <= maxRetries) {
      console.log(`🔄 Retrying direct connection in ${retryDelay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
      
      retryTimeoutRef.current = setTimeout(() => {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
        setupDirectSubscription(tokenValid === true);
      }, retryDelay);
    } else {
      console.log('🚨 Max retries exceeded for direct subscription');
      setConnectionStatus('error');
    }
  }, [setupDirectSubscription, tokenValid]);

  // Main effect - validate token and setup subscription
  useEffect(() => {
    if (!enabled || !streamerId || !obsToken) {
      console.log(`⏸️ Direct alerts disabled - enabled: ${enabled}, streamerId: ${streamerId}, obsToken: ${!!obsToken}`);
      return;
    }

    console.log(`🎯 Initializing direct alerts for ${tableName}`);
    
    let isActive = true; // Prevent race conditions
    let initalized = false; // Prevent duplicate initialization
    
    // First validate token, then setup subscription
    const initializeConnection = async () => {
      if (initalized) return;
      initalized = true;
      
      const isValid = await validateToken();
      if (isActive && isValid && !channelRef.current) {
        setupDirectSubscription(isValid);
      }
    };

    initializeConnection();

    return () => {
      console.log(`🛑 Cleaning up direct alerts for ${tableName}`);
      isActive = false;
      
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
      alertedDonationsRef.current.clear();
      setConnectionStatus('connecting');
      setTokenValid(null);
    };
  }, [streamerId, tableName, enabled, obsToken]); // Removed function dependencies to prevent excessive rerenders

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

  // Test voice alert function
  const triggerTestVoiceAlert = useCallback(() => {
    const testVoiceAlert: Donation = {
      id: `test-voice-${Date.now()}`,
      name: 'Voice Test',
      amount: 50,
      message: 'Send a Voice message',
      voice_message_url: 'test-voice-url',
      created_at: new Date().toISOString(),
      is_hyperemote: false
    };
    
    console.log('🧪 Triggering test voice alert');
    showAlert(testVoiceAlert, 'Test voice alert');
  }, [showAlert]);

  return {
    currentAlert,
    isVisible,
    connectionStatus,
    triggerTestAlert,
    triggerTestVoiceAlert,
    tokenValid
  };
};