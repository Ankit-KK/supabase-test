import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message?: string;
  created_at: string;
  is_hyperemote?: boolean;
  voice_message_url?: string;
}

interface Streamer {
  id: string;
  user_id: string;
  streamer_slug: string;
  streamer_name: string;
  brand_color: string;
  obs_token: string;
}

interface AlertQueueItem {
  donation: Donation;
  timestamp: number;
}

interface WebSocketMessage {
  type: 'donation_approved' | 'connection_ack' | 'error' | 'ping' | 'pong';
  streamer_slug?: string;
  donation?: Donation;
  message?: string;
  timestamp?: number;
}

const AnkitAlertsWebSocket = () => {
  const { token: pathToken } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const obsToken = (pathToken && pathToken !== 'undefined' && pathToken !== 'null')
    ? pathToken
    : (searchParams.get('token') || searchParams.get('t') || '');
  
  const [streamer, setStreamer] = useState<Streamer | null>(null);
  const [currentAlert, setCurrentAlert] = useState<AlertQueueItem | null>(null);
  const [alertQueue, setAlertQueue] = useState<AlertQueueItem[]>([]);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [displayedMessage, setDisplayedMessage] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);

  const MAX_RECONNECT_ATTEMPTS = 10;
  const RECONNECT_DELAY = 3000;
  
  // Hyperemote configurations
  const hyperemotes = [
    { id: 'happy', src: '/lovable-uploads/2f07c754-6bf7-40e6-8a98-f181f991614a.png', name: 'Happy' },
    { id: 'peaceful', src: '/lovable-uploads/292d1bf8-f7af-4bf3-8540-9e79fda428c2.png', name: 'Peaceful' },
    { id: 'disappointed', src: '/lovable-uploads/a62460bb-2981-4570-8bce-51472286d43f.png', name: 'Disappointed' },
    { id: 'upset', src: '/lovable-uploads/2016b23f-1791-4159-b604-4ec5ecbf505e.png', name: 'Upset' },
    { id: 'wink', src: '/lovable-uploads/2e0cb8ea-caa0-4039-a256-b14849269d25.png', name: 'Wink' },
    { id: 'surprised', src: '/lovable-uploads/6c1ab8e8-8d6f-48bf-9111-059acae74a34.png', name: 'Surprised' },
    { id: 'excited', src: '/lovable-uploads/5459b5bb-a628-4c02-a9ca-4b374fe1fe38.png', name: 'Excited' },
    { id: 'love', src: '/lovable-uploads/33359350-7d33-4384-81d9-99fcf0220f60.png', name: 'Love' },
    { id: 'sleepy', src: '/lovable-uploads/cd661d15-1109-41d5-9908-70531edc117c.png', name: 'Sleepy' },
    { id: 'crying', src: '/lovable-uploads/2d18e120-71ab-48bf-8ead-36620a7546a8.png', name: 'Crying' },
  ];

  const enabled = searchParams.get('enabled') !== 'false';

  // Token validation function
  const validateToken = useCallback(async () => {
    if (!obsToken) {
      setIsValidToken(false);
      return false;
    }

    try {
      console.log('🔍 Validating OBS token...');
      const { data, error } = await supabase
        .rpc('get_streamer_by_obs_token_v2', { token: obsToken });

      if (error || !data) {
        console.error('❌ Token validation failed:', error);
        setIsValidToken(false);
        return false;
      }
      
      const rows = Array.isArray(data) ? data : (data ? [data] : []);
      if (!rows || rows.length === 0) {
        console.error('❌ No streamer found for token');
        setIsValidToken(false);
        return false;
      }

      // Verify this is for ankit
      if (rows[0].streamer_slug !== 'ankit') {
        console.error('❌ This token is not valid for Ankit');
        setIsValidToken(false);
        return false;
      }

      console.log('✅ Token validation successful:', rows[0].streamer_name);
      setStreamer(rows[0]);
      setIsValidToken(true);
      reconnectAttemptsRef.current = 0;
      return true;
    } catch (error) {
      console.error('❌ Error validating token:', error);
      setIsValidToken(false);
      return false;
    }
  }, [obsToken]);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (!obsToken || !enabled) {
      console.log('❌ Cannot connect WebSocket: missing token or disabled');
      return;
    }

    setConnectionStatus('connecting');
    console.log('🔌 Connecting to WebSocket...');

    const wsUrl = `wss://vsevsjvtrshgeiudrnth.supabase.co/functions/v1/obs-alerts-ws?token=${obsToken}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('🚀 WebSocket connected successfully');
      setConnectionStatus('connected');
      reconnectAttemptsRef.current = 0;
      wsRef.current = ws;
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('📨 WebSocket message received:', message);

        switch (message.type) {
          case 'connection_ack':
            console.log('✅ Connection acknowledged:', message.message);
            break;
          
          case 'ping':
            // Respond to ping with pong
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            }
            break;
          
          case 'donation_approved':
            if (message.donation) {
              console.log('🎉 New donation alert:', message.donation.name, message.donation.amount);
              setAlertQueue(prev => [...prev, { 
                donation: message.donation!,
                timestamp: Date.now() 
              }]);
            }
            break;
          
          case 'error':
            console.error('❌ WebSocket error message:', message.message);
            break;
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('🔌 WebSocket disconnected:', event.code, event.reason);
      setConnectionStatus('disconnected');
      wsRef.current = null;
      
      // Attempt to reconnect if not too many attempts
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current++;
        const delay = RECONNECT_DELAY * reconnectAttemptsRef.current;
        console.log(`📡 Scheduling reconnection attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, delay);
      } else {
        console.error('❌ Max reconnection attempts reached');
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setConnectionStatus('disconnected');
    };

  }, [obsToken, enabled]);

  // Initial setup
  useEffect(() => {
    validateToken();
  }, [validateToken]);

  // Connect WebSocket when token is valid
  useEffect(() => {
    if (isValidToken && enabled) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [isValidToken, enabled, connectWebSocket]);

  // Process alert queue
  useEffect(() => {
    if (!currentAlert && alertQueue.length > 0) {
      const nextAlert = alertQueue[0];
      console.log('🎬 Processing next alert from queue:', {
        donorName: nextAlert.donation.name,
        amount: nextAlert.donation.amount,
        queueLength: alertQueue.length,
        isHyperemote: nextAlert.donation.is_hyperemote
      });
      setCurrentAlert(nextAlert);
      setAlertQueue(prev => prev.slice(1));
    }
  }, [alertQueue, currentAlert]);

  // Typing effect for donation message
  useEffect(() => {
    if (!currentAlert?.donation.message) {
      setDisplayedMessage("");
      return;
    }

    const fullMessage = currentAlert.donation.message;
    setDisplayedMessage("");
    let index = 0;

    const interval = setInterval(() => {
      setDisplayedMessage(fullMessage.slice(0, index + 1));
      index++;
      if (index === fullMessage.length) clearInterval(interval);
    }, 100);

    return () => clearInterval(interval);
  }, [currentAlert]);

  // Auto-clear current alert after display time
  useEffect(() => {
    if (!currentAlert) return;
    
    let totalTime;
    if (currentAlert.donation.is_hyperemote) {
      totalTime = 10000; // 10 seconds for hyperemotes
    } else if (currentAlert.donation.voice_message_url) {
      totalTime = 4000; // 4 seconds for voice messages
    } else {
      const messageLength = currentAlert.donation.message?.length || 0;
      const typingTime = messageLength * 100;
      const displayTime = 3000;
      totalTime = typingTime + displayTime;
    }
    
    const timer = setTimeout(() => {
      setCurrentAlert(null);
      setDisplayedMessage("");
    }, totalTime);
    return () => clearTimeout(timer);
  }, [currentAlert]);

  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-2">Invalid OBS Token</h1>
          <p className="text-gray-300">Please check your OBS browser source URL</p>
        </div>
      </div>
    );
  }

  if (!enabled) {
    return <div className="min-h-screen bg-transparent"></div>;
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatUp {
          0% { 
            opacity: 0; 
            transform: translateY(100vh) scale(0.5) rotate(0deg); 
          }
          20% { 
            opacity: 1; 
            transform: translateY(80vh) scale(1) rotate(180deg); 
          }
          80% { 
            opacity: 1; 
            transform: translateY(20vh) scale(1.2) rotate(340deg); 
          }
          100% { 
            opacity: 0; 
            transform: translateY(-10vh) scale(0.8) rotate(360deg); 
          }
        }
        @keyframes floatUpLeft {
          0% { 
            opacity: 0; 
            transform: translateY(100vh) translateX(0) scale(0.5) rotate(0deg); 
          }
          50% { 
            opacity: 1; 
            transform: translateY(50vh) translateX(-100px) scale(1.1) rotate(180deg); 
          }
          100% { 
            opacity: 0; 
            transform: translateY(-10vh) translateX(-200px) scale(0.7) rotate(360deg); 
          }
        }
        @keyframes floatUpRight {
          0% { 
            opacity: 0; 
            transform: translateY(100vh) translateX(0) scale(0.5) rotate(0deg); 
          }
          50% { 
            opacity: 1; 
            transform: translateY(50vh) translateX(100px) scale(1.1) rotate(-180deg); 
          }
          100% { 
            opacity: 0; 
            transform: translateY(-10vh) translateX(200px) scale(0.7) rotate(-360deg); 
          }
        }
        @keyframes spiralUp {
          0% { 
            opacity: 0; 
            transform: translateY(100vh) rotateY(0deg) scale(0.5); 
          }
          25% { 
            opacity: 1; 
            transform: translateY(75vh) rotateY(90deg) scale(1); 
          }
          50% { 
            opacity: 1; 
            transform: translateY(50vh) rotateY(180deg) scale(1.2); 
          }
          75% { 
            opacity: 1; 
            transform: translateY(25vh) rotateY(270deg) scale(1); 
          }
          100% { 
            opacity: 0; 
            transform: translateY(-10vh) rotateY(360deg) scale(0.8); 
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
      
      <div className="min-h-screen bg-transparent overflow-hidden relative">
        {/* Connection Status Debug Info */}
        <div className="fixed top-4 right-4 text-xs text-white bg-black bg-opacity-50 p-2 rounded">
          WebSocket: {connectionStatus} | Queue: {alertQueue.length}
        </div>

        {currentAlert && currentAlert.donation.is_hyperemote && (
          <div className="fixed inset-0 pointer-events-none">
            {Array.from({ length: 12 }, (_, index) => {
              const emote = hyperemotes[index % hyperemotes.length];
              const animations = ['floatUp', 'floatUpLeft', 'floatUpRight', 'spiralUp'];
              const animationType = animations[index % animations.length];
              const duration = 8 + Math.random() * 4;
              const delay = Math.random() * 2;
              const horizontalOffset = (Math.random() - 0.5) * 200;

              return (
                <div
                  key={`${currentAlert.timestamp}-${index}`}
                  className="absolute"
                  style={{
                    left: `${20 + (index * 7)}%`,
                    animationName: animationType,
                    animationDuration: `${duration}s`,
                    animationDelay: `${delay}s`,
                    animationTimingFunction: 'ease-out',
                    animationFillMode: 'both',
                    transform: `translateX(${horizontalOffset}px)`
                  }}
                >
                  <img 
                    src={emote.src} 
                    alt={emote.name} 
                    className="w-16 h-16 object-contain"
                    style={{
                      filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))'
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {currentAlert && !currentAlert.donation.is_hyperemote && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg shadow-2xl animate-fadeIn max-w-2xl mx-4">
              <div className="text-center">
                <h2 className="text-4xl font-bold mb-4">💰 New Donation!</h2>
                <div className="text-2xl font-semibold mb-2">{currentAlert.donation.name}</div>
                <div className="text-3xl font-bold text-yellow-300 mb-4">
                  ₹{currentAlert.donation.amount}
                </div>
                
                {currentAlert.donation.voice_message_url ? (
                  <div className="text-lg">
                    🎵 Voice Message
                    <audio 
                      src={currentAlert.donation.voice_message_url} 
                      autoPlay 
                      className="hidden"
                    />
                  </div>
                ) : (
                  currentAlert.donation.message && (
                    <div className="text-lg italic min-h-[2rem]">
                      "{displayedMessage}"
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AnkitAlertsWebSocket;