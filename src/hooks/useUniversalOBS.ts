import { useState, useEffect, useRef } from 'react';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message?: string | null;
  voice_message_url?: string | null;
  is_hyperemote: boolean;
  created_at: string;
  streamer_id: string;
  payment_status: string;
  moderation_status: string;
  message_visible: boolean;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export const useUniversalOBS = (token: string, streamerSlug: string) => {
  const [currentAlert, setCurrentAlert] = useState<Donation | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [connectionCount, setConnectionCount] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (!token || !streamerSlug) return;
    
    setConnectionStatus('connecting');
    
    const wsUrl = `wss://vsevsjvtrshgeiudrnth.supabase.co/functions/v1/obs-alerts-universal?token=${encodeURIComponent(token)}&streamerSlug=${encodeURIComponent(streamerSlug)}`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('Universal OBS WebSocket connected');
        setConnectionStatus('connected');
        setConnectionCount(prev => prev + 1);
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'donation_alert') {
            showAlert(message.donation);
          } else if (message.type === 'test_alert') {
            showAlert(message.donation);
          } else if (message.type === 'ping') {
            // Send pong response
            wsRef.current?.send(JSON.stringify({ type: 'pong' }));
          } else if (message.type === 'connection_ack') {
            console.log('Connection acknowledged:', message.message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('Universal OBS WebSocket disconnected');
        setConnectionStatus('disconnected');
        scheduleReconnect();
      };
      
      wsRef.current.onerror = (error) => {
        console.error('Universal OBS WebSocket error:', error);
        setConnectionStatus('error');
        scheduleReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnectionStatus('error');
      scheduleReconnect();
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setConnectionStatus('disconnected');
  };

  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) return;
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      connect();
    }, 3000);
  };

  const showAlert = (donation: Donation) => {
    setCurrentAlert(donation);
    setIsVisible(true);
    
    // Play notification sound
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (error) {
      console.log('Audio notification failed:', error);
    }
    
    // Calculate display duration based on amount (higher amounts show longer)
    const baseDuration = 5000;
    const amountMultiplier = Math.min(donation.amount * 100, 10000);
    const totalDuration = baseDuration + amountMultiplier;
    
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }
    
    alertTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setCurrentAlert(null), 500);
    }, totalDuration);
    
    // Play voice message if available
    if (donation.voice_message_url) {
      try {
        const voiceAudio = new Audio(donation.voice_message_url);
        voiceAudio.volume = 0.8;
        setTimeout(() => {
          voiceAudio.play().catch(e => console.log('Voice play failed:', e));
        }, 1000);
      } catch (error) {
        console.log('Voice message play failed:', error);
      }
    }
  };

  useEffect(() => {
    if (token && streamerSlug) {
      connect();
    }
    
    return () => {
      disconnect();
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, [token, streamerSlug]);

  return {
    currentAlert,
    isVisible,
    connectionStatus,
    connectionCount,
    connect,
    disconnect
  };
};