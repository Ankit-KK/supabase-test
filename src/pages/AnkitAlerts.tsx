import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { AlertDebugInfo } from '@/components/AlertDebugInfo';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message?: string;
  created_at: string;
  payment_status: string;
  message_visible?: boolean;
  is_hyperemote?: boolean;
  voice_message_url?: string;
  moderation_status?: string;
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

const AnkitAlerts = () => {
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const validationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);

  const MAX_RECONNECT_ATTEMPTS = 10;
  const RECONNECT_DELAY = 5000; // 5 seconds
  const VALIDATION_INTERVAL = 60000; // 1 minute
  const HEARTBEAT_INTERVAL = 30000; // 30 seconds
  
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
      console.log('Validating OBS token...');
      const { data, error } = await supabase
        .rpc('get_streamer_by_obs_token_v2', { token: obsToken });

      if (error || !data) {
        console.error('Token validation failed:', error);
        setIsValidToken(false);
        return false;
      }
      
      const rows = Array.isArray(data) ? data : (data ? [data] : []);
      if (!rows || rows.length === 0) {
        console.error('No streamer found for token');
        setIsValidToken(false);
        return false;
      }

      // Verify this is for ankit
      if (rows[0].streamer_slug !== 'ankit') {
        console.error('This token is not valid for Ankit');
        setIsValidToken(false);
        return false;
      }

      console.log('Token validation successful:', rows[0].streamer_name);
      setStreamer(rows[0]);
      setIsValidToken(true);
      reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful validation
      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      setIsValidToken(false);
      return false;
    }
  }, [obsToken]);

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('Cleaning up connections and timers...');
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (validationIntervalRef.current) {
      clearInterval(validationIntervalRef.current);
      validationIntervalRef.current = null;
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Schedule reconnection attempt
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached. Stopping reconnection attempts.');
      return;
    }

    reconnectAttemptsRef.current += 1;
    const delay = RECONNECT_DELAY * Math.pow(2, Math.min(reconnectAttemptsRef.current - 1, 3)); // Exponential backoff
    
    console.log(`Scheduling reconnection attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('Attempting to reconnect...');
      // Reconnection is now handled by the centralized subscription hook
    }, delay);
  }, [streamer?.id]);

  // Use centralized subscription for alerts
  const alertConnectionState = useRealtimeSubscription({
    streamerId: streamer?.id,
    streamerSlug: 'ankit',
    onDonationUpdate: (payload) => {
      const newDonation = payload.new as Donation;
      console.log('Alert received real-time event:', payload.eventType, newDonation?.name);
      
      if (payload.eventType === 'INSERT' && newDonation.payment_status === 'success') {
        const donation = newDonation;
        console.log('New donation received:', { name: donation.name, amount: donation.amount, message: donation.message });
        
        // Only show approved donations or auto-approved hyperemotes
        if (donation.moderation_status === 'approved' || donation.moderation_status === 'auto_approved') {
          setAlertQueue(prev => [...prev, { 
            donation, 
            timestamp: Date.now() 
          }]);
        }
      }
      
      if (payload.eventType === 'UPDATE' && newDonation.payment_status === 'success') {
        const oldDonation = payload.old as Donation;
        const donation = newDonation;
        
        // Show alert if payment was completed OR if donation was just approved
        const paymentCompleted = oldDonation.payment_status !== 'success';
        const justApproved = oldDonation.moderation_status !== 'approved' && 
                           donation.moderation_status === 'approved';
        
        if (paymentCompleted || justApproved) {
          console.log('Donation update triggered alert:', { 
            name: donation.name, 
            amount: donation.amount,
            paymentCompleted,
            justApproved
          });
          
          // Only show approved donations or auto-approved hyperemotes
          if (donation.moderation_status === 'approved' || donation.moderation_status === 'auto_approved') {
            setAlertQueue(prev => [...prev, { 
              donation, 
              timestamp: Date.now() 
            }]);
          }
        }
      }
    },
    enabled: !!streamer?.id && enabled
  });

  // Update connection status based on centralized subscription
  useEffect(() => {
    setConnectionStatus(alertConnectionState.status);
  }, [alertConnectionState.status]);

  // Initial token validation
  useEffect(() => {
    validateToken();
  }, [validateToken]);

  // Token validation only happens once on mount and on connection errors
  // No periodic validation needed - use real-time connection status instead

  // Cleanup effect
  useEffect(() => {
    return cleanup;
  }, [cleanup]);


  // Process alert queue
  useEffect(() => {
    if (!currentAlert && alertQueue.length > 0) {
      const nextAlert = alertQueue[0];
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
      // Hyperemotes show for 10 seconds
      totalTime = 10000;
    } else if (currentAlert.donation.voice_message_url) {
      // Voice messages show for 4 seconds
      totalTime = 4000;
    } else {
      // Regular messages: typing time + display time
      const messageLength = currentAlert.donation.message?.length || 0;
      const typingTime = messageLength * 100; // 100ms per character
      const displayTime = 3000; // 3 seconds after typing completes
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
        {currentAlert && currentAlert.donation.is_hyperemote && (
          <div className="fixed inset-0 pointer-events-none">
            {/* Generate multiple emotes with different animations */}
            {Array.from({ length: 12 }, (_, index) => {
              const emote = hyperemotes[index % hyperemotes.length];
              const animations = ['floatUp', 'floatUpLeft', 'floatUpRight', 'spiralUp'];
              const animationType = animations[index % animations.length];
              const delay = (index % 4) * 1; // Stagger the start times more
              const duration = 10; // Fixed 10 second duration for all emotes
              const leftPosition = 10 + (index * 7) % 80; // Spread across screen width
              
              return (
                <img
                  key={`${emote.id}-${index}-${currentAlert.timestamp}`}
                  src={emote.src}
                  alt={emote.name}
                  className="absolute w-20 h-20"
                  style={{
                    left: `${leftPosition}%`,
                    animation: `${animationType} ${duration}s ease-in-out ${delay}s both`,
                    zIndex: 10 + index
                  }}
                />
              );
            })}
          </div>
        )}
        
        {currentAlert && !currentAlert.donation.is_hyperemote && (
          // Regular Message Display
          <div className="fixed inset-x-0 bottom-6 flex items-center justify-center bg-transparent">
            <div 
              className="p-4 rounded-xl shadow-xl text-center animate-fadeIn text-white"
              style={{ 
                background: currentAlert.donation.voice_message_url 
                  ? "linear-gradient(135deg, #007BFF, #8A2BE2)" 
                  : "linear-gradient(135deg, #1E90FF, #BF00FF)",
                minWidth: "280px",
                maxWidth: "400px"
              }}
            >
              <div className="mb-2 text-lg font-bold">
                🎉 {currentAlert.donation.name} donated ₹{currentAlert.donation.amount}!
              </div>
              {currentAlert.donation.message && (
                <div className="text-sm italic border-t border-white/20 pt-2 break-words whitespace-pre-wrap">
                  "{displayedMessage}"
                </div>
              )}
              {currentAlert.donation.voice_message_url && (
                <div className="mt-2 text-xs bg-white/20 rounded-full px-3 py-1 inline-block">
                  🎤 Voice Message
                </div>
              )}
            </div>
          </div>
        )}

        {/* Voice Message Player */}
        {currentAlert?.donation.voice_message_url && (
          <audio
            autoPlay
            className="hidden"
            onEnded={() => console.log('Voice message finished')}
          >
            <source src={currentAlert.donation.voice_message_url} type="audio/webm" />
            <source src={currentAlert.donation.voice_message_url} type="audio/mpeg" />
          </audio>
        )}

        {/* Debug info for development */}
        <AlertDebugInfo
          streamerId={streamer?.id}
          streamerSlug="ankit"
          connectionState={{ status: connectionStatus }}
        />
      </div>
    </>
  );
};

export default AnkitAlerts;