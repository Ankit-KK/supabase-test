import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeSubscriptionOptions {
  streamerId?: string;
  streamerSlug?: string;
  onDonationUpdate?: (payload: any) => void;
  enabled?: boolean;
}

interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected';
  error?: string;
}

interface SubscriptionInfo {
  channel: RealtimeChannel;
  status: 'subscribing' | 'subscribed' | 'failed' | 'disposing';
  retryCount: number;
  lastAttempt: number;
}

// Global subscription registry to prevent duplicate subscriptions
const globalSubscriptions = new Map<string, SubscriptionInfo>();
const reconnectTimeouts = new Map<string, NodeJS.Timeout>();

export const useRealtimeSubscription = (options: RealtimeSubscriptionOptions) => {
  const { streamerId, streamerSlug, onDonationUpdate, enabled = true } = options;
  const [connectionState, setConnectionState] = useState<ConnectionState>({ status: 'connecting' });
  const callbackRef = useRef(onDonationUpdate);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = onDonationUpdate;
  }, [onDonationUpdate]);

  const getTableName = useCallback((slug?: string) => {
    if (!slug) return 'chia_gaming_donations';
    
    const tableMap: { [key: string]: string } = {
      'ankit': 'ankit_donations',
      'chia_gaming': 'chia_gaming_donations',
      'demostreamer': 'demostreamer_donations',
      'musicstream': 'musicstream_donations',
      'techgamer': 'techgamer_donations',
      'fitnessflow': 'fitnessflow_donations',
      'artcreate': 'artcreate_donations', // For future use
      'codelive': 'codelive_donations'    // For future use
    };
    
    return tableMap[slug] || 'chia_gaming_donations';
  }, []);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
  }, []);

  const subscribe = useCallback(() => {
    if (!streamerId || !enabled) {
      setConnectionState({ status: 'disconnected', error: 'No streamer ID or disabled' });
      return;
    }

    const subscriptionKey = `${streamerId}-${streamerSlug}`;
    const tableName = getTableName(streamerSlug);
    
    // Clear any existing timeout for this key
    const existingTimeout = reconnectTimeouts.get(subscriptionKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      reconnectTimeouts.delete(subscriptionKey);
    }
    
    // Check if we already have an active subscription for this streamer
    let subscriptionInfo = globalSubscriptions.get(subscriptionKey);
    
    if (!subscriptionInfo || subscriptionInfo.status === 'failed' || subscriptionInfo.status === 'disposing') {
      // Prevent multiple rapid subscription attempts
      if (subscriptionInfo?.status === 'subscribing') {
        console.log('🔗 Subscription already in progress for:', tableName, 'streamer:', streamerId);
        setConnectionState({ status: 'connecting' });
        return;
      }

      console.log('🔗 Creating NEW centralized subscription for:', tableName, 'streamer:', streamerId);
      setConnectionState({ status: 'connecting' });

      const channel = supabase
        .channel(`global-${subscriptionKey}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: tableName,
            filter: `streamer_id=eq.${streamerId}`
          },
          (payload) => {
            const donationData = payload.new as any;
            console.log('🔔 Global subscription received update:', {
              event: payload.eventType,
              table: tableName,
              donor: donationData?.name,
              amount: donationData?.amount,
              status: donationData?.moderation_status,
              payment: donationData?.payment_status
            });
            
            // Notify all subscribers via a custom event
            window.dispatchEvent(new CustomEvent('donation-update', {
              detail: { payload, streamerId, streamerSlug, tableName }
            }));
          }
        )
        .subscribe((status) => {
          console.log('🔗 Global subscription status:', status);
          const currentSubscription = globalSubscriptions.get(subscriptionKey);
          
          if (status === 'SUBSCRIBED') {
            setConnectionState({ status: 'connected' });
            console.log('✅ Successfully connected to centralized real-time updates');
            if (currentSubscription) {
              currentSubscription.status = 'subscribed';
              currentSubscription.retryCount = 0;
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            setConnectionState({ status: 'disconnected', error: `Connection ${status}` });
            console.log('❌ Connection lost, will attempt to reconnect...');
            
            if (currentSubscription) {
              currentSubscription.status = 'failed';
              currentSubscription.retryCount++;
              
              // Properly dispose of the failed channel
              supabase.removeChannel(currentSubscription.channel);
              
              // Implement exponential backoff with max retry limit
              const maxRetries = 5;
              const baseDelay = 2000;
              const delay = Math.min(baseDelay * Math.pow(2, currentSubscription.retryCount), 30000);
              
              if (currentSubscription.retryCount < maxRetries) {
                const timeout = setTimeout(() => {
                  globalSubscriptions.delete(subscriptionKey);
                  reconnectTimeouts.delete(subscriptionKey);
                  subscribe();
                }, delay);
                
                reconnectTimeouts.set(subscriptionKey, timeout);
              } else {
                console.log('❌ Max reconnection attempts reached, giving up');
                globalSubscriptions.delete(subscriptionKey);
              }
            }
          }
        });

      // Create new subscription info
      subscriptionInfo = {
        channel,
        status: 'subscribing',
        retryCount: 0,
        lastAttempt: Date.now()
      };
      
      globalSubscriptions.set(subscriptionKey, subscriptionInfo);
    } else if (subscriptionInfo.status === 'subscribed') {
      console.log('🔗 Reusing existing centralized subscription for:', tableName, 'streamer:', streamerId);
      setConnectionState({ status: 'connected' });
    }

    // Set up local event listener for this component
    const handleDonationUpdate = (event: CustomEvent) => {
      const { payload, streamerId: eventStreamerId } = event.detail;
      if (eventStreamerId === streamerId && callbackRef.current) {
        callbackRef.current(payload);
      }
    };

    window.addEventListener('donation-update', handleDonationUpdate as EventListener);

    return () => {
      window.removeEventListener('donation-update', handleDonationUpdate as EventListener);
    };
  }, [streamerId, streamerSlug, enabled, getTableName]);

  // Subscribe when dependencies change
  useEffect(() => {
    if (streamerId && enabled) {
      const unsubscribe = subscribe();
      return () => {
        cleanup();
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } else {
      cleanup();
    }
  }, [streamerId, enabled]); // Remove subscribe and cleanup from dependencies

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return connectionState;
};

// Utility function to manually clean up all subscriptions (for app-level cleanup)
export const cleanupAllRealtimeSubscriptions = () => {
  console.log('🧹 Cleaning up all global real-time subscriptions');
  for (const [key, subscriptionInfo] of globalSubscriptions.entries()) {
    supabase.removeChannel(subscriptionInfo.channel);
    globalSubscriptions.delete(key);
  }
  
  // Clear all reconnection timeouts
  for (const [key, timeout] of reconnectTimeouts.entries()) {
    clearTimeout(timeout);
    reconnectTimeouts.delete(key);
  }
};