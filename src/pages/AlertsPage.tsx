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
            if (donation.message_visible !== false) {
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
            if (donation.message_visible !== false) {
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

  // Auto-clear current alert after 5 seconds
  useEffect(() => {
    if (!currentAlert) return;
    const timer = setTimeout(() => {
      setCurrentAlert(null);
      setDisplayedMessage("");
    }, 5000);
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
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
      
      <div className="min-h-screen bg-transparent overflow-hidden relative">
        {currentAlert && (
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
      </div>
    </>
  );
};

export default AlertsPage;