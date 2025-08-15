import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/dashboardUtils';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message?: string;
  created_at: string;
  message_visible: boolean;
  payment_status: string;
  streamer_id?: string;
}

interface Streamer {
  id: string;
  user_id: string;
  streamer_slug: string;
  streamer_name: string;
  brand_color: string;
  brand_logo_url?: string;
  obs_token?: string;
}

interface AlertQueueItem {
  id: string;
  donation: Donation;
  timestamp: number;
}

const AlertsPage = () => {
  const { token } = useParams<{ token: string }>();
  const [streamer, setStreamer] = useState<Streamer | null>(null);
  const [alertQueue, setAlertQueue] = useState<AlertQueueItem[]>([]);
  const [currentAlert, setCurrentAlert] = useState<AlertQueueItem | null>(null);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [obsAlertsEnabled, setObsAlertsEnabled] = useState(true);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Read enabled parameter from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const enabled = urlParams.get('enabled');
    setObsAlertsEnabled(enabled !== 'false');
  }, []);

  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      return;
    }

    const validateToken = async () => {
      try {
        const { data: streamerData, error } = await supabase
          .from('streamers')
          .select('*')
          .eq('obs_token', token)
          .single();

        if (error || !streamerData) {
          setIsValidToken(false);
          return;
        }

        setStreamer(streamerData);
        setIsValidToken(true);
      } catch (error) {
        console.error('Error validating token:', error);
        setIsValidToken(false);
      }
    };

    validateToken();
  }, [token]);

  useEffect(() => {
    if (!streamer || !isValidToken) return;

    // Set up realtime subscription for new donations
    const channel = supabase
      .channel('obs-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chia_gaming_donations',
          filter: `streamer_id=eq.${streamer.id}`
        },
        (payload) => {
          console.log('Alert update received:', payload);
          
          if (payload.eventType === 'INSERT' && payload.new.payment_status === 'success') {
            const newDonation = payload.new as Donation;
            if (newDonation.message_visible) {
              const alertItem: AlertQueueItem = {
                id: `alert-${newDonation.id}-${Date.now()}`,
                donation: newDonation,
                timestamp: Date.now()
              };
              setAlertQueue(prev => [...prev, alertItem]);
            }
          }
          
          if (payload.eventType === 'UPDATE') {
            const updatedDonation = payload.new as Donation;
            
            // If payment status changed to success and message is visible, show alert
            if (
              updatedDonation.payment_status === 'success' && 
              (payload.old as any).payment_status !== 'success' &&
              updatedDonation.message_visible
            ) {
              const alertItem: AlertQueueItem = {
                id: `alert-${updatedDonation.id}-${Date.now()}`,
                donation: updatedDonation,
                timestamp: Date.now()
              };
              setAlertQueue(prev => [...prev, alertItem]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamer, isValidToken]);

  // Process alert queue
  useEffect(() => {
    if (currentAlert || alertQueue.length === 0) return;

    const nextAlert = alertQueue[0];
    setCurrentAlert(nextAlert);
    setAlertQueue(prev => prev.slice(1));

    // Clear alert after 5 seconds
    alertTimeoutRef.current = setTimeout(() => {
      setCurrentAlert(null);
    }, 5000);

    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, [currentAlert, alertQueue]);

  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-500">Invalid OBS Token</h1>
          <p className="text-gray-600 mt-2">This alert URL is not valid or has been regenerated.</p>
        </div>
      </div>
    );
  }

  // If alerts are disabled, show nothing (transparent page for OBS)
  if (!obsAlertsEnabled) {
    return (
      <div className="min-h-screen bg-transparent"></div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent overflow-hidden relative">
      {currentAlert && obsAlertsEnabled && (
        <div className="fixed top-8 right-8 z-50 animate-slide-in-right">
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg shadow-2xl border border-primary/20 p-6 min-w-[400px] max-w-md animate-scale-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">New Donation!</h3>
              <div className="text-2xl font-bold">
                {formatCurrency(Number(currentAlert.donation.amount))}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm opacity-90">From:</span>
                <span className="font-semibold">{currentAlert.donation.name}</span>
              </div>
              
              {currentAlert.donation.message && (
                <div className="bg-white/10 rounded p-3 mt-3">
                  <p className="text-sm italic">"{currentAlert.donation.message}"</p>
                </div>
              )}
            </div>
            
            {/* Animated progress bar */}
            <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white/60 animate-[progress_5s_linear]"
                style={{
                  animation: 'progress 5s linear forwards'
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes scale-in {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.5s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AlertsPage;