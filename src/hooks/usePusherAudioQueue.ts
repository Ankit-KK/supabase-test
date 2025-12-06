import { useEffect, useState, useCallback, useRef } from 'react';
import Pusher from 'pusher-js';

export interface AudioDonation {
  id: string;
  name: string;
  amount: number;
  message?: string;
  voice_message_url?: string;
  tts_audio_url?: string;
  created_at: string;
  is_hyperemote: boolean;
  moderation_status: string;
  payment_status: string;
  streamer_id?: string;
}

interface UsePusherAudioQueueConfig {
  streamerSlug: string;
  pusherKey?: string;
  pusherCluster?: string;
  onNewAudioMessage?: (donation: AudioDonation) => void;
  delayBeforeDisplay?: number; // Delay in milliseconds before adding to queue
}

export const usePusherAudioQueue = ({
  streamerSlug,
  pusherKey,
  pusherCluster,
  onNewAudioMessage,
  delayBeforeDisplay = 0
}: UsePusherAudioQueueConfig) => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [queueSize, setQueueSize] = useState(0);

  // Store callback in ref to prevent reconnection loop
  const onNewAudioMessageRef = useRef(onNewAudioMessage);

  // Update ref when callback changes
  useEffect(() => {
    onNewAudioMessageRef.current = onNewAudioMessage;
  }, [onNewAudioMessage]);

  useEffect(() => {
    // Wait for pusher config to be available
    if (!pusherKey || !pusherCluster) {
      console.log('[PusherAudioQueue] Waiting for Pusher config...');
      return;
    }

    console.log('[PusherAudioQueue] Initializing Pusher connection...');
    
    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
    });

    pusher.connection.bind('connecting', () => {
      console.log('[PusherAudioQueue] Connecting to Pusher...');
      setConnectionStatus('connecting');
    });

    pusher.connection.bind('connected', () => {
      console.log('[PusherAudioQueue] Connected to Pusher');
      setConnectionStatus('connected');
    });

    pusher.connection.bind('disconnected', () => {
      console.log('[PusherAudioQueue] Disconnected from Pusher');
      setConnectionStatus('disconnected');
    });

    pusher.connection.bind('error', (err: any) => {
      console.error('[PusherAudioQueue] Pusher connection error:', err);
      setConnectionStatus('error');
    });

    const channelName = `${streamerSlug}-audio`;
    console.log('[PusherAudioQueue] Subscribing to channel:', channelName);
    const channel = pusher.subscribe(channelName);

    channel.bind('pusher:subscription_succeeded', () => {
      console.log('[PusherAudioQueue] Subscribed to channel:', channelName);
    });

    // New audio message ready
    channel.bind('new-audio-message', (data: AudioDonation) => {
      console.log('[PusherAudioQueue] New audio message received:', data);
      
      if (delayBeforeDisplay > 0) {
        console.log(`[PusherAudioQueue] Delaying audio message for ${delayBeforeDisplay}ms`);
        setTimeout(() => {
          if (onNewAudioMessageRef.current) {
            onNewAudioMessageRef.current(data);
          }
          setQueueSize(prev => prev + 1);
        }, delayBeforeDisplay);
      } else {
        if (onNewAudioMessageRef.current) {
          onNewAudioMessageRef.current(data);
        }
        setQueueSize(prev => prev + 1);
      }
    });

    return () => {
      console.log('[PusherAudioQueue] Cleaning up Pusher connection');
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [streamerSlug, pusherKey, pusherCluster]);

  const decrementQueue = useCallback(() => {
    setQueueSize(prev => Math.max(0, prev - 1));
  }, []);

  return {
    connectionStatus,
    queueSize,
    decrementQueue
  };
};
