import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { alertQueueManager, Donation, QueuedAlert } from '@/utils/alertQueueManager';

interface UnifiedAlertsConfig {
  streamerId: string;
  tableName: string;
  obsToken?: string;
  enabled?: boolean;
}

type ConnectionStatus = 'connecting' | 'connected' | 'polling' | 'disconnected';

const CONFIG = {
  REALTIME_RECONNECT_DELAYS: [1000, 2000, 5000, 10000, 20000, 30000],
  REALTIME_HEALTH_CHECK_INTERVAL: 30000,
  POLLING_INTERVAL: 5000,
  STARTUP_SYNC_WINDOW: 300000, // 5 minutes
  ALERT_DURATION: {
    TEXT: 5000,
    HYPEREMOTE: 8000,
    VOICE: 15000,
  },
};

export function useUnifiedAlerts(config: UnifiedAlertsConfig) {
  const { streamerId, tableName, obsToken, enabled = true } = config;

  const [currentAlert, setCurrentAlert] = useState<Donation | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const healthCheckIntervalRef = useRef<NodeJS.Timeout>();
  const lastRealtimeMessageRef = useRef<number>(0);
  const isProcessingQueueRef = useRef(false);
  const displayTimeoutRef = useRef<NodeJS.Timeout>();

  // Validate OBS token
  const validateToken = useCallback(async () => {
    if (!obsToken) {
      setTokenValid(false);
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('validate_obs_token_secure', {
        token_to_check: obsToken,
      });

      if (error) throw error;

      const isValid = data?.[0]?.is_valid || false;
      setTokenValid(isValid);
      return isValid;
    } catch (error) {
      console.error('Token validation error:', error);
      setTokenValid(false);
      return false;
    }
  }, [obsToken]);

  // Process next alert from queue
  const processNextAlert = useCallback(async () => {
    if (isProcessingQueueRef.current || currentAlert) return;

    isProcessingQueueRef.current = true;

    try {
      const nextAlert = await alertQueueManager.getNextAlert();
      
      if (nextAlert) {
        console.log('Processing alert from queue:', nextAlert.id);
        
        await alertQueueManager.markAsDisplaying(nextAlert.id);
        
        setCurrentAlert(nextAlert.donation);
        setIsVisible(true);

        // Calculate display duration
        let duration = CONFIG.ALERT_DURATION.TEXT;
        if (nextAlert.donation.is_hyperemote) {
          duration = CONFIG.ALERT_DURATION.HYPEREMOTE;
        } else if (nextAlert.donation.voice_message_url) {
          duration = CONFIG.ALERT_DURATION.VOICE;
        }

        // Auto-hide and mark as completed
        if (displayTimeoutRef.current) {
          clearTimeout(displayTimeoutRef.current);
        }

        displayTimeoutRef.current = setTimeout(async () => {
          setIsVisible(false);
          await alertQueueManager.markAsCompleted(nextAlert.id);
          
          setTimeout(() => {
            setCurrentAlert(null);
            isProcessingQueueRef.current = false;
            processNextAlert(); // Process next in queue
          }, 500);
        }, duration);
      } else {
        isProcessingQueueRef.current = false;
      }
    } catch (error) {
      console.error('Error processing queue:', error);
      isProcessingQueueRef.current = false;
    }
  }, [currentAlert]);

  // Add alert to queue
  const addToQueue = useCallback(async (donation: Donation) => {
    const added = await alertQueueManager.addAlert(donation);
    if (added) {
      console.log('Alert added to queue:', donation.id);
      processNextAlert();
    }
  }, [processNextAlert]);

  // Startup sync - fetch recent donations
  const performStartupSync = useCallback(async () => {
    console.log('Performing startup sync...');
    
    try {
      const fiveMinutesAgo = new Date(Date.now() - CONFIG.STARTUP_SYNC_WINDOW).toISOString();
      
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .eq('streamer_id', streamerId)
        .eq('payment_status', 'success')
        .in('moderation_status', ['approved', 'auto_approved'])
        .eq('message_visible', true)
        .gte('created_at', fiveMinutesAgo)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        console.log(`Found ${data.length} recent donations for sync`);
        for (const donation of data) {
          await addToQueue(donation as unknown as Donation);
        }
      }
    } catch (error) {
      console.error('Startup sync error:', error);
    }
  }, [streamerId, tableName, addToQueue]);

  // Polling fallback
  const pollForAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .eq('streamer_id', streamerId)
        .eq('payment_status', 'success')
        .in('moderation_status', ['approved', 'auto_approved'])
        .eq('message_visible', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        for (const donation of data) {
          await addToQueue(donation as unknown as Donation);
        }
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, [streamerId, tableName, addToQueue]);

  // Setup Supabase Realtime subscription
  const setupRealtimeSubscription = useCallback(async () => {
    if (!enabled || !streamerId) return;

    console.log('Setting up realtime subscription...');

    // Clean up existing channel
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`alerts-${streamerId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: `streamer_id=eq.${streamerId}`,
        },
        async (payload) => {
          console.log('Realtime event received:', payload);
          lastRealtimeMessageRef.current = Date.now();

          const donation = payload.new as unknown as Donation;

          // Filter for approved and successful payments
          if (
            donation.payment_status === 'success' &&
            (donation.moderation_status === 'approved' || 
             donation.moderation_status === 'auto_approved') &&
            donation.message_visible !== false
          ) {
            await addToQueue(donation);
          }
        }
      )
      .subscribe(async (status) => {
        console.log('Subscription status:', status);

        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
          reconnectAttemptRef.current = 0;
          lastRealtimeMessageRef.current = Date.now();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionStatus('disconnected');
          scheduleReconnect();
        }
      });

    channelRef.current = channel;
  }, [enabled, streamerId, tableName, addToQueue]);

  // Schedule reconnection with exponential backoff
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = CONFIG.REALTIME_RECONNECT_DELAYS[
      Math.min(reconnectAttemptRef.current, CONFIG.REALTIME_RECONNECT_DELAYS.length - 1)
    ];

    console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current + 1})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptRef.current += 1;
      setupRealtimeSubscription();
    }, delay);
  }, [setupRealtimeSubscription]);

  // Start polling fallback
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;

    console.log('Starting polling fallback...');
    setConnectionStatus('polling');

    pollingIntervalRef.current = setInterval(() => {
      pollForAlerts();
    }, CONFIG.POLLING_INTERVAL);

    // Immediate poll
    pollForAlerts();
  }, [pollForAlerts]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = undefined;
    }
  }, []);

  // Health check for realtime connection
  const checkRealtimeHealth = useCallback(() => {
    const timeSinceLastMessage = Date.now() - lastRealtimeMessageRef.current;

    if (timeSinceLastMessage > CONFIG.REALTIME_HEALTH_CHECK_INTERVAL) {
      console.log('Realtime appears stale, switching to polling...');
      setConnectionStatus('polling');
      startPolling();
    } else if (connectionStatus === 'connected') {
      stopPolling();
    }
  }, [connectionStatus, startPolling, stopPolling]);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    console.log('Manual sync triggered');
    await performStartupSync();
  }, [performStartupSync]);

  // Initialize
  useEffect(() => {
    if (!enabled) return;

    (async () => {
      // Initialize queue manager
      await alertQueueManager.init();
      await alertQueueManager.clearOldShown();

      // Validate token if provided
      if (obsToken) {
        const valid = await validateToken();
        if (!valid) return;
      }

      // Startup sync
      await performStartupSync();

      // Setup realtime
      await setupRealtimeSubscription();

      // Start health check
      healthCheckIntervalRef.current = setInterval(
        checkRealtimeHealth,
        CONFIG.REALTIME_HEALTH_CHECK_INTERVAL
      );
    })();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
      if (displayTimeoutRef.current) {
        clearTimeout(displayTimeoutRef.current);
      }
    };
  }, [enabled, obsToken, validateToken, performStartupSync, setupRealtimeSubscription, checkRealtimeHealth]);

  // Handle visibility change (tab active/inactive)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab became visible, triggering sync...');
        triggerSync();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [triggerSync]);

  // Handle network changes
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network restored, reconnecting...');
      setupRealtimeSubscription();
      triggerSync();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [setupRealtimeSubscription, triggerSync]);

  return {
    currentAlert,
    isVisible,
    connectionStatus,
    tokenValid,
    triggerSync,
  };
}
