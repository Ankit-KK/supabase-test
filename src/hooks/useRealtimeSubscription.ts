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
  referenceCount: number;
  callbacks: Set<string>;
}

// Global subscription registry with reference counting
const globalSubscriptions = new Map<string, SubscriptionInfo>();
const reconnectTimeouts = new Map<string, NodeJS.Timeout>();
const componentCallbacks = new Map<string, (payload: any) => void>();
const subscriptionLocks = new Set<string>();

// Debouncing for reconnection attempts
const reconnectionDebounceTimeouts = new Map<string, NodeJS.Timeout>();

export const useRealtimeSubscription = (options: RealtimeSubscriptionOptions) => {
  const { streamerId, streamerSlug, onDonationUpdate, enabled = true } = options;
  const [connectionState, setConnectionState] = useState<ConnectionState>({ status: 'connecting' });
  const callbackRef = useRef(onDonationUpdate);
  const componentIdRef = useRef(`${Math.random().toString(36).substr(2, 9)}-${Date.now()}`);

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
      'artcreate': 'artcreate_donations',
      'codelive': 'codelive_donations'
    };
    
    return tableMap[slug] || 'chia_gaming_donations';
  }, []);

  const scheduleReconnect = useCallback((subscriptionKey: string, retryCount: number) => {
    // Clear any existing debounce timeout
    const existingDebounce = reconnectionDebounceTimeouts.get(subscriptionKey);
    if (existingDebounce) {
      clearTimeout(existingDebounce);
    }

    // Implement circuit breaker pattern
    const maxRetries = 5;
    const baseDelay = 2000;
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), 30000) + jitter;

    if (retryCount >= maxRetries) {
      console.log('❌ Max reconnection attempts reached, implementing circuit breaker');
      setConnectionState({ status: 'disconnected', error: 'Max retries exceeded' });
      
      // Circuit breaker: try again after a longer delay
      const circuitBreakerTimeout = setTimeout(() => {
        const subscription = globalSubscriptions.get(subscriptionKey);
        if (subscription && subscription.referenceCount > 0) {
          console.log('🔄 Circuit breaker reset, attempting reconnection');
          subscription.retryCount = 0; // Reset retry count
          scheduleReconnect(subscriptionKey, 0);
        }
      }, 60000); // 1 minute circuit breaker delay
      
      reconnectionDebounceTimeouts.set(subscriptionKey, circuitBreakerTimeout);
      return;
    }

    const debounceTimeout = setTimeout(() => {
      reconnectionDebounceTimeouts.delete(subscriptionKey);
      
      // Check if subscription still needed
      const subscription = globalSubscriptions.get(subscriptionKey);
      if (subscription && subscription.referenceCount > 0) {
        console.log(`🔄 Attempting reconnection #${retryCount + 1} for ${subscriptionKey}`);
        createSubscription(subscriptionKey);
      }
    }, delay);

    reconnectionDebounceTimeouts.set(subscriptionKey, debounceTimeout);
  }, []);

  const createSubscription = useCallback((subscriptionKey: string) => {
    // Check subscription lock to prevent concurrent operations
    if (subscriptionLocks.has(subscriptionKey)) {
      console.log('🔒 Subscription creation blocked by lock for:', subscriptionKey);
      return;
    }

    const tableName = getTableName(streamerSlug);
    
    // Set lock
    subscriptionLocks.add(subscriptionKey);
    
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
          
          // Notify all registered callbacks
          const subscription = globalSubscriptions.get(subscriptionKey);
          if (subscription) {
            subscription.callbacks.forEach(callbackId => {
              const callback = componentCallbacks.get(callbackId);
              if (callback) {
                try {
                  callback(payload);
                } catch (error) {
                  console.error('Error in subscription callback:', error);
                }
              }
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('🔗 Global subscription status:', status);
        const subscription = globalSubscriptions.get(subscriptionKey);
        
        if (status === 'SUBSCRIBED') {
          setConnectionState({ status: 'connected' });
          console.log('✅ Successfully connected to centralized real-time updates');
          if (subscription) {
            subscription.status = 'subscribed';
            subscription.retryCount = 0;
          }
          // Release lock on successful subscription
          subscriptionLocks.delete(subscriptionKey);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setConnectionState({ status: 'disconnected', error: `Connection ${status}` });
          console.log('❌ Connection lost, scheduling reconnection...');
          
          // Release lock on error
          subscriptionLocks.delete(subscriptionKey);
          
          if (subscription) {
            subscription.status = 'failed';
            subscription.retryCount++;
            
            // Properly dispose of the failed channel
            try {
              supabase.removeChannel(subscription.channel);
            } catch (error) {
              console.error('Error removing failed channel:', error);
            }
            
            // Schedule reconnection with debouncing and circuit breaker
            scheduleReconnect(subscriptionKey, subscription.retryCount);
          }
        }
      });

    // Create or update subscription info with reference counting
    let subscriptionInfo = globalSubscriptions.get(subscriptionKey);
    if (!subscriptionInfo) {
      subscriptionInfo = {
        channel,
        status: 'subscribing',
        retryCount: 0,
        lastAttempt: Date.now(),
        referenceCount: 0,
        callbacks: new Set()
      };
      globalSubscriptions.set(subscriptionKey, subscriptionInfo);
    } else {
      // Update existing subscription with new channel
      subscriptionInfo.channel = channel;
      subscriptionInfo.status = 'subscribing';
      subscriptionInfo.lastAttempt = Date.now();
    }
  }, [streamerId, streamerSlug, getTableName, scheduleReconnect]);

  const subscribe = useCallback(() => {
    if (!streamerId || !enabled) {
      setConnectionState({ status: 'disconnected', error: 'No streamer ID or disabled' });
      return;
    }

    const subscriptionKey = `${streamerId}-${streamerSlug}`;
    const componentId = componentIdRef.current;
    
    // Register callback for this component
    if (callbackRef.current) {
      componentCallbacks.set(componentId, callbackRef.current);
    }
    
    let subscriptionInfo = globalSubscriptions.get(subscriptionKey);
    
    if (!subscriptionInfo) {
      // Create new subscription with reference counting
      createSubscription(subscriptionKey);
      subscriptionInfo = globalSubscriptions.get(subscriptionKey);
    }
    
    if (subscriptionInfo) {
      // Increment reference count and add callback
      subscriptionInfo.referenceCount++;
      subscriptionInfo.callbacks.add(componentId);
      
      console.log(`📊 Reference count for ${subscriptionKey}: ${subscriptionInfo.referenceCount}`);
      
      if (subscriptionInfo.status === 'subscribed') {
        setConnectionState({ status: 'connected' });
      } else if (subscriptionInfo.status === 'failed') {
        setConnectionState({ status: 'disconnected', error: 'Connection failed' });
      } else {
        setConnectionState({ status: 'connecting' });
      }
    }

    // Return cleanup function for this component
    return () => {
      const subscription = globalSubscriptions.get(subscriptionKey);
      if (subscription) {
        // Decrement reference count and remove callback
        subscription.referenceCount = Math.max(0, subscription.referenceCount - 1);
        subscription.callbacks.delete(componentId);
        
        console.log(`📊 Reference count after cleanup for ${subscriptionKey}: ${subscription.referenceCount}`);
        
        // Clean up subscription if no more references
        if (subscription.referenceCount === 0) {
          console.log('🧹 No more references, cleaning up subscription:', subscriptionKey);
          
          // Clean up channel
          try {
            supabase.removeChannel(subscription.channel);
          } catch (error) {
            console.error('Error removing channel during cleanup:', error);
          }
          
          // Clean up timeouts
          const existingTimeout = reconnectTimeouts.get(subscriptionKey);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
            reconnectTimeouts.delete(subscriptionKey);
          }
          
          const existingDebounce = reconnectionDebounceTimeouts.get(subscriptionKey);
          if (existingDebounce) {
            clearTimeout(existingDebounce);
            reconnectionDebounceTimeouts.delete(subscriptionKey);
          }
          
          // Remove from global registry
          globalSubscriptions.delete(subscriptionKey);
          subscriptionLocks.delete(subscriptionKey);
        }
      }
      
      // Clean up component callback
      componentCallbacks.delete(componentId);
    };
  }, [streamerId, streamerSlug, enabled, createSubscription]);

  // Subscribe when dependencies change
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    if (streamerId && enabled) {
      cleanup = subscribe();
    } else {
      setConnectionState({ status: 'disconnected', error: 'No streamer ID or disabled' });
    }

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [subscribe]);

  return connectionState;
};

// Utility function to manually clean up all subscriptions (for app-level cleanup)
export const cleanupAllRealtimeSubscriptions = () => {
  console.log('🧹 Emergency cleanup of all global real-time subscriptions');
  
  // Clear all subscription locks
  subscriptionLocks.clear();
  
  // Clean up all subscriptions
  for (const [key, subscriptionInfo] of globalSubscriptions.entries()) {
    try {
      supabase.removeChannel(subscriptionInfo.channel);
    } catch (error) {
      console.error('Error removing channel during emergency cleanup:', error);
    }
    globalSubscriptions.delete(key);
  }
  
  // Clear all reconnection timeouts
  for (const [key, timeout] of reconnectTimeouts.entries()) {
    clearTimeout(timeout);
    reconnectTimeouts.delete(key);
  }
  
  // Clear all debounce timeouts
  for (const [key, timeout] of reconnectionDebounceTimeouts.entries()) {
    clearTimeout(timeout);
    reconnectionDebounceTimeouts.delete(key);
  }
  
  // Clear all component callbacks
  componentCallbacks.clear();
  
  console.log('✅ Emergency cleanup completed');
};