import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message?: string;
  created_at: string;
  payment_status: string;
  message_visible?: boolean;
  is_hyperemote?: boolean;
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

const AlertsPage = () => {
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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

  // Validate OBS token and fetch streamer
  useEffect(() => {
    if (!obsToken) {
      setIsValidToken(false);
      return;
    }

    const validateToken = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_streamer_by_obs_token_v2', { token: obsToken });

        if (error || !data) {
          setIsValidToken(false);
          return;
        }
        
        const rows = Array.isArray(data) ? data : (data ? [data] : []);
        if (!rows || rows.length === 0) {
          setIsValidToken(false);
          return;
        }

        setStreamer(rows[0]);
        setIsValidToken(true);
      } catch (error) {
        setIsValidToken(false);
      }
    };

    validateToken();
  }, [obsToken]);

  // Subscribe to real-time donations
  useEffect(() => {
    if (!streamer?.id) return;

    const channel = supabase
      .channel(`alerts-${streamer.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chia_gaming_donations',
          filter: `streamer_id=eq.${streamer.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new.payment_status === 'success') {
            const donation = payload.new as Donation;
            console.log('New donation received:', { name: donation.name, amount: donation.amount, message: donation.message });
            // Show all donations (hyperemotes don't need message_visible check)
            if (donation.is_hyperemote || donation.message_visible !== false) {
              setAlertQueue(prev => [...prev, { 
                donation, 
                timestamp: Date.now() 
              }]);
            }
          }
          
          if (payload.eventType === 'UPDATE' && 
              payload.new.payment_status === 'success' && 
              payload.old.payment_status !== 'success') {
            const donation = payload.new as Donation;
            // Show all donations (hyperemotes don't need message_visible check)
            if (donation.is_hyperemote || donation.message_visible !== false) {
              setAlertQueue(prev => [...prev, { 
                donation, 
                timestamp: Date.now() 
              }]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamer?.id]);

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
      // Hyperemotes show for 4 seconds
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
        @keyframes bounceIn {
          0% { transform: scale(0.3) rotate(-10deg); opacity: 0; }
          50% { transform: scale(1.1) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        .animate-bounceIn {
          animation: bounceIn 0.8s ease-out;
        }
        .animate-float {
          animation: float 2s ease-in-out infinite;
        }
      `}</style>
      
      <div className="min-h-screen bg-transparent overflow-hidden relative">
        {currentAlert && (
          <>
            {currentAlert.donation.is_hyperemote ? (
              // Hyperemote Display
              <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  {/* Random emotes floating around */}
                  {hyperemotes.slice(0, 6).map((emote, index) => (
                    <img
                      key={`${emote.id}-${index}`}
                      src={emote.src}
                      alt={emote.name}
                      className="absolute w-16 h-16 animate-bounceIn animate-float"
                      style={{
                        left: `${20 + (index * 15)}%`,
                        top: `${30 + (index % 3) * 20}%`,
                        animationDelay: `${index * 0.2}s`,
                        animationDuration: '2s'
                      }}
                    />
                  ))}
                  
                  {/* Main donation info */}
                  <div 
                    className="p-6 rounded-2xl shadow-2xl text-center animate-bounceIn text-white z-10 relative"
                    style={{ 
                      background: "linear-gradient(135deg, #ff6b6b, #ffd93d)",
                      minWidth: "350px",
                    }}
                  >
                    <h2 className="text-2xl font-bold mb-2">
                      🎉 {currentAlert.donation.name} 🎉
                    </h2>
                    <p className="text-4xl font-extrabold mb-2 animate-pulse">
                      ₹{currentAlert.donation.amount}
                    </p>
                    <p className="text-lg font-medium">
                      sent hyperemotes!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Regular Message Display
              <div className="fixed inset-x-0 bottom-6 flex items-center justify-center bg-transparent">
                <div 
                  className="p-4 rounded-xl shadow-xl text-center animate-fadeIn text-white"
                  style={{ 
                    background: "linear-gradient(135deg, #4f46e5, #9333ea)",
                    minWidth: "280px",
                    maxWidth: "400px"
                  }}
                >
                  <h2 className="text-xl font-bold mb-1">
                    {currentAlert.donation.name}
                  </h2>
                  <p className="text-3xl font-extrabold mb-3 animate-pulse">
                    ₹{currentAlert.donation.amount}
                  </p>
                  {currentAlert.donation.message && (
                    <p className="text-base font-light">
                      {displayedMessage || "..."}
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default AlertsPage;