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
  
  console.log('OBS Alerts: token parsed', {
    pathToken,
    queryToken: searchParams.get('token'),
    t: searchParams.get('t'),
    obsToken
  });

  const [streamer, setStreamer] = useState<Streamer | null>(null);
  const [currentAlert, setCurrentAlert] = useState<AlertQueueItem | null>(null);
  const [alertQueue, setAlertQueue] = useState<AlertQueueItem[]>([]);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const enabled = searchParams.get('enabled') !== 'false';

  // Validate OBS token and fetch streamer
  useEffect(() => {
    if (!obsToken) {
      console.warn('OBS Alerts: missing token');
      setIsValidToken(false);
      return;
    }

    const validateToken = async () => {
      try {
        console.log('OBS Alerts: validating token', obsToken);
        const { data, error } = await supabase
          .rpc('get_streamer_by_obs_token_v2', { token: obsToken });

        if (error) {
          console.error('OBS Alerts: RPC error', error);
          setIsValidToken(false);
          return;
        }
        console.log('OBS Alerts: RPC result', data);
        const rows = Array.isArray(data) ? data : (data ? [data] : []);
        if (!rows || rows.length === 0) {
          console.warn('OBS Alerts: token not found', obsToken);
          setIsValidToken(false);
          return;
        }

        setStreamer(rows[0]);
        setIsValidToken(true);
      } catch (error) {
        console.error('Error validating token:', error);
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
          console.log('Alert received:', payload);
          
          if (payload.eventType === 'INSERT' && payload.new.payment_status === 'success') {
            const donation = payload.new as Donation;
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
    if (alertQueue.length > 0 && !currentAlert) {
      const nextAlert = alertQueue[0];
      setCurrentAlert(nextAlert);
      setAlertQueue(prev => prev.slice(1));

      // Clear alert after 5 seconds
      timeoutRef.current = setTimeout(() => {
        setCurrentAlert(null);
      }, 5000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [alertQueue, currentAlert]);

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
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.5s ease-out forwards;
        }
      `}</style>
      
      <div className="min-h-screen bg-transparent overflow-hidden relative">
        {currentAlert && (
          <div 
            className="fixed top-20 right-20 z-50 animate-slideInRight"
            style={{
              animationDuration: '0.5s',
              animationFillMode: 'both'
            }}
          >
            <div 
              className="bg-black/80 backdrop-blur-sm border-2 rounded-lg p-6 shadow-2xl min-w-80 max-w-md"
              style={{ 
                borderColor: streamer?.brand_color || '#6366f1',
                boxShadow: `0 0 30px ${streamer?.brand_color || '#6366f1'}40`
              }}
            >
              <div className="text-center">
                <div 
                  className="text-2xl font-bold mb-2"
                  style={{ color: streamer?.brand_color || '#6366f1' }}
                >
                  New Donation! 🎉
                </div>
                
                <div className="text-white text-xl font-semibold mb-1">
                  {currentAlert.donation.name}
                </div>
                
                <div 
                  className="text-3xl font-bold mb-3"
                  style={{ color: streamer?.brand_color || '#6366f1' }}
                >
                  ₹{currentAlert.donation.amount}
                </div>
                
                {currentAlert.donation.message && currentAlert.donation.message_visible !== false && (
                  <div className="text-gray-200 text-sm italic max-w-xs mx-auto break-words">
                    "{currentAlert.donation.message}"
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AlertsPage;