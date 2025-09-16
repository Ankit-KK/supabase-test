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

// Global subscription registry to prevent duplicate subscriptions
const globalSubscriptions = new Map<string, RealtimeChannel>();

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
      'demostreamer': 'demostreamer_donations'
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
    
    // Check if we already have a subscription for this streamer
    let channel = globalSubscriptions.get(subscriptionKey);
    
    if (!channel) {
      console.log('🔗 Creating NEW centralized subscription for:', tableName, 'streamer:', streamerId);
      setConnectionState({ status: 'connecting' });

      channel = supabase
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
          
          if (status === 'SUBSCRIBED') {
            setConnectionState({ status: 'connected' });
            console.log('✅ Successfully connected to centralized real-time updates');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            setConnectionState({ status: 'disconnected', error: `Connection ${status}` });
            console.log('❌ Connection lost, will attempt to reconnect...');
            
            // Remove failed channel and schedule reconnect
            globalSubscriptions.delete(subscriptionKey);
            reconnectTimeoutRef.current = setTimeout(() => {
              subscribe();
            }, 5000);
          }
        });

      globalSubscriptions.set(subscriptionKey, channel);
    } else {
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
    }
  }, [streamerId, enabled, subscribe, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return connectionState;
};

// Utility function to manually clean up all subscriptions (for app-level cleanup)
export const cleanupAllRealtimeSubscriptions = () => {
  console.log('🧹 Cleaning up all global real-time subscriptions');
  for (const [key, channel] of globalSubscriptions.entries()) {
    supabase.removeChannel(channel);
    globalSubscriptions.delete(key);
  }
};