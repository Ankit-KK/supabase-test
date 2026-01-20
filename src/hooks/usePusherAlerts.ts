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
  media_url?: string | null;
  media_type?: string | null;
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
  const displayedIdsRef = useRef<Set<string>>(new Set());

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
    
    // Prevent duplicate displays - check both queue and already displayed
    if (displayedIdsRef.current.has(donation.id)) {
      console.log('[PusherAlerts] Skipping duplicate (already displayed):', donation.id);
      return;
    }
    
    if (alertQueueRef.current.some(d => d.id === donation.id)) {
      console.log('[PusherAlerts] Alert already in queue, skipping');
      return;
    }

    // Mark as displayed
    displayedIdsRef.current.add(donation.id);
    alertQueueRef.current.push(donation);
    processNextAlert();
  }, [processNextAlert]);

  // Clear displayed IDs periodically to prevent memory buildup
  useEffect(() => {
    const cleanup = setInterval(() => {
      displayedIdsRef.current.clear();
    }, 5 * 60 * 1000); // Clear every 5 minutes
    return () => clearInterval(cleanup);
  }, []);

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

    // Bind to audio-now-playing event - triggered when Media Source plays audio
    // This ensures perfect sync between visual alert and audio playback
    channel.bind('audio-now-playing', (data: Donation) => {
      console.log('[PusherAlerts] Audio now playing - showing alert immediately:', data);
      addToQueueRef.current(data);
    });

    // Bind to new-donation event - IGNORE for visual alerts
    // All donations go through TTS pipeline, so we ALWAYS wait for audio-now-playing
    // This event is only used for dashboard notifications, not visual alerts
    channel.bind('new-donation', (data: Donation) => {
      console.log('[PusherAlerts] New donation received (ignoring for visual alert, waiting for audio-now-playing):', data.id);
      // Don't add to queue - always wait for audio-now-playing event from get-current-audio
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
