import { useState, useEffect, useCallback, useRef } from 'react';
import Pusher from 'pusher-js';

interface Donation {
  id: string;
  name: string;
  amount: number;
  currency?: string;
  message: string | null;
  voice_message_url: string | null;
  tts_audio_url: string | null;
  hypersound_url?: string | null;
  is_hyperemote: boolean;
  created_at: string;
  streamer_id: string;
  audio_scheduled_at?: string; // Server timestamp for syncing with audio
}

interface PusherAlertsConfig {
  channelName: string;
  pusherKey: string;
  pusherCluster: string;
  delayBeforeDisplay?: number;
  delayByType?: {
    text?: number;
    voice?: number;
    hypersound?: number;
  };
  alertDuration?: {
    text: number;
    hyperemote: number;
    voice: number;
  };
}

export function usePusherAlerts(config: PusherAlertsConfig) {
  const {
    channelName,
    pusherKey,
    pusherCluster,
    delayBeforeDisplay = 0,
    delayByType = {},
    alertDuration = { text: 5000, hyperemote: 8000, voice: 15000 },
  } = config;

  const [currentAlert, setCurrentAlert] = useState<Donation | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);
  const alertQueueRef = useRef<Donation[]>([]);
  const displayTimeoutRef = useRef<NodeJS.Timeout>();
  const isProcessingRef = useRef(false);
  const addToQueueRef = useRef<(donation: Donation) => void>(() => {});

  // Process next alert from queue
  const processNextAlert = useCallback(() => {
    if (isProcessingRef.current || alertQueueRef.current.length === 0) {
      return;
    }

    const nextAlert = alertQueueRef.current.shift()!;
    isProcessingRef.current = true;

    console.log('[PusherAlerts] Displaying alert:', nextAlert.id);

    setCurrentAlert(nextAlert);
    setIsVisible(true);

    // Calculate display duration
    let duration = alertDuration.text;
    if (nextAlert.is_hyperemote) {
      duration = alertDuration.hyperemote;
    } else if (nextAlert.voice_message_url || nextAlert.tts_audio_url) {
      duration = alertDuration.voice;
    }

    // Auto-hide after duration
    if (displayTimeoutRef.current) {
      clearTimeout(displayTimeoutRef.current);
    }

    displayTimeoutRef.current = setTimeout(() => {
      console.log('[PusherAlerts] Hiding alert:', nextAlert.id);
      setIsVisible(false);

      setTimeout(() => {
        setCurrentAlert(null);
        isProcessingRef.current = false;
        
        // Process next alert in queue
        if (alertQueueRef.current.length > 0) {
          processNextAlert();
        }
      }, 500); // Fade out transition
    }, duration);
  }, [alertDuration]);

  // Add alert to queue
  const addToQueue = useCallback((donation: Donation) => {
    console.log('[PusherAlerts] Adding to queue:', donation.id);
    
    // Check if already in queue
    if (alertQueueRef.current.some(d => d.id === donation.id)) {
      console.log('[PusherAlerts] Alert already in queue, skipping');
      return;
    }

    alertQueueRef.current.push(donation);
    processNextAlert();
  }, [processNextAlert]);

  // Update ref when addToQueue changes
  useEffect(() => {
    addToQueueRef.current = addToQueue;
  }, [addToQueue]);

  // Initialize Pusher connection
  useEffect(() => {
    // Don't initialize if credentials are not yet loaded
    if (!pusherKey || !pusherCluster) {
      console.log('[PusherAlerts] Waiting for Pusher credentials...');
      setConnectionStatus('connecting');
      return;
    }

    console.log('[PusherAlerts] Initializing Pusher connection...');
    
    // Enable Pusher logging in development
    if (process.env.NODE_ENV === 'development') {
      Pusher.logToConsole = true;
    }

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
    });

    pusherRef.current = pusher;

    // Connection state tracking
    pusher.connection.bind('connecting', () => {
      console.log('[PusherAlerts] Connecting to Pusher...');
      setConnectionStatus('connecting');
    });

    pusher.connection.bind('connected', () => {
      console.log('[PusherAlerts] Connected to Pusher');
      setConnectionStatus('connected');
    });

    pusher.connection.bind('disconnected', () => {
      console.log('[PusherAlerts] Disconnected from Pusher');
      setConnectionStatus('disconnected');
    });

    pusher.connection.bind('error', (error: any) => {
      console.error('[PusherAlerts] Pusher connection error:', error);
      setConnectionStatus('disconnected');
    });

    // Subscribe to channel
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    channel.bind('pusher:subscription_succeeded', () => {
      console.log('[PusherAlerts] Subscribed to channel:', channelName);
    });

    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('[PusherAlerts] Subscription error:', error);
    });

    // Bind to new-donation event
    channel.bind('new-donation', (data: Donation) => {
      console.log('[PusherAlerts] New donation received:', data);
      
      // Use server-provided audio_scheduled_at for sync with audio playback
      let delay = 0;
      
      if (data.audio_scheduled_at) {
        // Calculate delay based on server timestamp for perfect sync with audio
        const scheduledTime = new Date(data.audio_scheduled_at).getTime();
        delay = Math.max(0, scheduledTime - Date.now());
        console.log(`[PusherAlerts] Using server timestamp for sync - delay: ${delay}ms (scheduled: ${data.audio_scheduled_at})`);
      } else {
        // Fallback to type-based delays if no server timestamp
        delay = delayBeforeDisplay;
        if (data.hypersound_url && delayByType.hypersound !== undefined) {
          delay = delayByType.hypersound;
        } else if (data.voice_message_url && delayByType.voice !== undefined) {
          delay = delayByType.voice;
        } else if (delayByType.text !== undefined) {
          delay = delayByType.text;
        }
        console.log(`[PusherAlerts] Using fallback delay: ${delay}ms (type-based)`);
      }
      
      if (delay > 0) {
        setTimeout(() => {
          addToQueueRef.current(data);
        }, delay);
      } else {
        addToQueueRef.current(data);
      }
    });

    // Cleanup
    return () => {
      console.log('[PusherAlerts] Cleaning up Pusher connection');
      
      if (channelRef.current) {
        channelRef.current.unbind_all();
        pusher.unsubscribe(channelName);
      }
      
      pusher.disconnect();
      
      if (displayTimeoutRef.current) {
        clearTimeout(displayTimeoutRef.current);
      }
    };
  }, [channelName, pusherKey, pusherCluster]);

  // Manual trigger for testing
  const triggerTestAlert = useCallback(() => {
    console.log('[PusherAlerts] Triggering test alert');
    
    const testDonation: Donation = {
      id: `test-${Date.now()}`,
      name: 'Test Donor',
      amount: 100,
      message: 'This is a test donation alert!',
      voice_message_url: null,
      tts_audio_url: null,
      is_hyperemote: false,
      created_at: new Date().toISOString(),
      streamer_id: 'test-streamer',
    };

    addToQueue(testDonation);
  }, [addToQueue]);

  return {
    currentAlert,
    isVisible,
    connectionStatus,
    triggerTestAlert,
    queueSize: alertQueueRef.current.length,
  };
}
