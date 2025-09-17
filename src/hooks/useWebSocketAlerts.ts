import { useState, useEffect, useRef, useCallback } from 'react';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  voice_message_url?: string;
  is_hyperemote: boolean;
  created_at: string;
}

interface WebSocketAlertsConfig {
  token: string;
  enabled?: boolean;
}

interface WebSocketMessage {
  type: 'donation_alert' | 'test_alert';
  donation: Donation;
}

export const useWebSocketAlerts = ({ token, enabled = true }: WebSocketAlertsConfig) => {
  const [currentAlert, setCurrentAlert] = useState<Donation | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const clearAlert = useCallback(() => {
    console.log('🧹 Clearing current alert');
    setIsVisible(false);
    
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = null;
    }
    
    setTimeout(() => {
      setCurrentAlert(null);
    }, 1000); // Allow fade out animation
  }, []);

  const showAlert = useCallback((donation: Donation, reason: string) => {
    console.log('🎬 Showing WebSocket alert:', { donation, reason });
    
    // Clear any existing alert
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }
    
    setCurrentAlert(donation);
    setIsVisible(true);
    
    // Auto-hide alert after duration
    const duration = donation.voice_message_url ? 15000 : 
                    donation.is_hyperemote ? 8000 : 6000;
    
    alertTimeoutRef.current = setTimeout(() => {
      clearAlert();
    }, duration);
  }, [clearAlert]);

  const connectWebSocket = useCallback(() => {
    if (!token || !enabled) {
      console.log('❌ WebSocket connection skipped - missing token or disabled');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING || 
        wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('🔄 WebSocket already connecting/connected');
      return;
    }

    console.log('🔌 Connecting to WebSocket...');
    setConnectionStatus('connecting');

    const wsUrl = `wss://vsevsjvtrshgeiudrnth.functions.supabase.co/obs-alerts-ws?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      setConnectionStatus('connected');
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('📨 WebSocket message received:', message);
        
        if (message.type === 'donation_alert' || message.type === 'test_alert') {
          showAlert(message.donation, `WebSocket ${message.type}`);
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('🔌 WebSocket closed:', event.code, event.reason);
      setConnectionStatus('disconnected');
      
      // Attempt reconnection if not intentionally closed
      if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connectWebSocket();
        }, delay);
      } else if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached');
        setConnectionStatus('error');
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setConnectionStatus('error');
    };
  }, [token, enabled, showAlert]);

  const triggerTestAlert = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log('❌ Cannot trigger test - WebSocket not connected');
      return;
    }
    
    console.log('🧪 Triggering test alert via WebSocket');
    const testDonation: Donation = {
      id: `test-${Date.now()}`,
      name: 'Test Donor', 
      amount: 10,
      message: 'This is a test alert!',
      is_hyperemote: false,
      created_at: new Date().toISOString()
    };
    
    showAlert(testDonation, 'Manual test');
  }, [showAlert]);

  // Connect on mount and when dependencies change
  useEffect(() => {
    if (enabled && token) {
      connectWebSocket();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [connectWebSocket, token, enabled]);

  return {
    currentAlert,
    isVisible,
    connectionStatus,
    triggerTestAlert,
    clearAlert
  };
};