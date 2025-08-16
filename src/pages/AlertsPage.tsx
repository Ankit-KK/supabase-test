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
        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
      
      <div className="min-h-screen bg-transparent overflow-hidden relative">
        {currentAlert && (
          <div className="fixed top-8 right-8 z-50 animate-slideIn">
            <div 
              className="bg-black/90 rounded-lg px-4 py-2 shadow-lg flex items-center gap-3 min-w-64"
              style={{ 
                borderLeft: `4px solid ${streamer?.brand_color || '#6366f1'}`
              }}
            >
              <div className="text-white font-medium">
                {currentAlert.donation.name}
              </div>
              <div 
                className="font-bold text-lg"
                style={{ color: streamer?.brand_color || '#6366f1' }}
              >
                ₹{currentAlert.donation.amount}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AlertsPage;