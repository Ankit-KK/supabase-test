import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Heart, Sparkles, Zap, Star, Music, Coffee, Gift, Flame } from "lucide-react";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  is_hyperemote: boolean;
  payment_status: string;
  moderation_status: string;
  created_at: string;
}

const HYPEREMOTE_ICONS = {
  50: Heart,
  100: Sparkles,
  150: Zap,
  200: Star,
  250: Music,
  300: Coffee,
  500: Gift,
  1000: Flame
};

export default function DemoStreamerAlerts() {
  const { token } = useParams<{ token: string }>();
  const [currentAlert, setCurrentAlert] = useState<Donation | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [streamerInfo, setStreamerInfo] = useState<any>(null);

  useEffect(() => {
    if (!token) return;

    // Validate token and get streamer info
    const validateToken = async () => {
      try {
        console.log('🔑 Validating OBS token for DemoStreamer alerts...');
        const { data } = await supabase
          .rpc('validate_obs_token_secure', { token_to_check: token });

        if (data && data.length > 0 && data[0].is_valid) {
          console.log('✅ DemoStreamer OBS token validated:', data[0].streamer_name);
          setStreamerInfo(data[0]);
        } else {
          console.error('❌ Invalid OBS token for DemoStreamer alerts');
        }
      } catch (error) {
        console.error('❌ Error validating OBS token:', error);
      }
    };

    validateToken();
  }, [token]);

  // Polling-based alert system for OBS compatibility
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [shownDonationIds, setShownDonationIds] = useState<Set<string>>(new Set());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [alertQueue, setAlertQueue] = useState<Donation[]>([]);

  useEffect(() => {
    if (!streamerInfo?.streamer_id) {
      setConnectionStatus('disconnected');
      return;
    }

    console.log('🔄 Setting up polling-based alert system for DemoStreamer donations...');
    setConnectionStatus('connecting');

    const pollForAlerts = async () => {
      try {
        const { data, error } = await supabase
          .from('demostreamer_donations')
          .select('*')
          .eq('streamer_id', streamerInfo.streamer_id)
          .eq('payment_status', 'success')
          .in('moderation_status', ['approved', 'auto_approved'])
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('❌ Error polling for DemoStreamer alerts:', error);
          setConnectionStatus('disconnected');
          return;
        }

        setConnectionStatus('connected');
        console.log(`📊 DemoStreamer: Found ${data?.length || 0} approved donations, shown IDs: ${shownDonationIds.size}`);

        if (data && data.length > 0) {
          let donationsToShow: any[] = [];

          if (isInitialLoad) {
            // On first load: show last 3 recent donations for immediate feedback
            donationsToShow = data.slice(0, 3);
            console.log(`🚀 DemoStreamer initial load: showing ${donationsToShow.length} recent donations`);
            setIsInitialLoad(false);
          } else {
            // On subsequent polls: only show donations we haven't seen before
            donationsToShow = data.filter(donation => !shownDonationIds.has(donation.id));
            console.log(`🔍 DemoStreamer polling: found ${donationsToShow.length} new donations out of ${data.length} total`);
          }

          if (donationsToShow.length > 0) {
            // Process donations in chronological order (oldest first)
            const sortedNew = donationsToShow
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

            sortedNew.forEach(donation => {
              console.log('🎉 Queuing DemoStreamer donation alert:', donation.name, donation.amount, donation.id.slice(-8));
              setAlertQueue(prev => [...prev, donation as Donation]);
            });

            // Track all shown donations
            setShownDonationIds(prev => {
              const newSet = new Set(prev);
              donationsToShow.forEach(donation => newSet.add(donation.id));
              return newSet;
            });
          }
        }
      } catch (error) {
        console.error('❌ Error in DemoStreamer polling:', error);
        setConnectionStatus('disconnected');
      }
    };

    // Initial poll
    pollForAlerts();

    // Set up polling interval (every 2 seconds)
    const interval = setInterval(pollForAlerts, 2000);

    return () => {
      console.log('🔌 Cleaning up DemoStreamer polling interval');
      clearInterval(interval);
      setConnectionStatus('disconnected');
    };
  }, [streamerInfo?.streamer_id, shownDonationIds.size, isInitialLoad]);

  // Process alert queue
  useEffect(() => {
    if (!currentAlert && alertQueue.length > 0) {
      const nextAlert = alertQueue[0];
      console.log('🎬 DemoStreamer: Processing next alert from queue:', nextAlert.name, nextAlert.amount);
      showAlert(nextAlert);
      setAlertQueue(prev => prev.slice(1));
    }
  }, [alertQueue, currentAlert]);

  const showAlert = (donation: Donation) => {
    setCurrentAlert(donation);
    setIsVisible(true);

    // Hide alert after 5 seconds
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setCurrentAlert(null), 500); // Allow fade out animation
    }, 5000);
  };

  const getHyperemoteIcon = (amount: number) => {
    // Find the closest hyperemote amount
    const amounts = Object.keys(HYPEREMOTE_ICONS).map(Number).sort((a, b) => a - b);
    let selectedAmount = amounts[0];
    
    for (const amt of amounts) {
      if (amount >= amt) {
        selectedAmount = amt;
      } else {
        break;
      }
    }
    
    return HYPEREMOTE_ICONS[selectedAmount as keyof typeof HYPEREMOTE_ICONS] || Gift;
  };

  if (!streamerInfo) {
    return (
      <div className="w-full h-screen bg-transparent flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading Demo Streamer Alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-transparent relative overflow-hidden">
      {/* Alert Display */}
      {currentAlert && (
        <div
          className={`absolute top-8 left-1/2 transform -translate-x-1/2 transition-all duration-500 ${
            isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
          }`}
        >
          <div 
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-2xl shadow-2xl border-4 border-white/20 backdrop-blur-sm min-w-[400px]"
            style={{
              animation: isVisible ? 'bounceIn 0.5s ease-out, pulse 2s infinite 0.5s' : 'none'
            }}
          >
            <div className="flex items-center justify-center mb-4">
              {currentAlert.is_hyperemote ? (
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
                  {React.createElement(getHyperemoteIcon(currentAlert.amount), {
                    className: "w-8 h-8 text-yellow-300"
                  })}
                </div>
              ) : (
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
                  <Heart className="w-8 h-8 text-red-300" />
                </div>
              )}
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2 animate-fadeIn">
                {currentAlert.is_hyperemote ? '✨ HYPEREMOTE! ✨' : '💖 New Donation!'}
              </h2>
              
              <div className="text-4xl font-extrabold mb-2 text-yellow-300 animate-pulse">
                ₹{currentAlert.amount.toLocaleString()}
              </div>
              
              <div className="text-xl font-semibold mb-3 animate-slideInUp">
                Thank you, {currentAlert.name}!
              </div>
              
              {currentAlert.message && (
                <div className="bg-white/10 rounded-lg p-3 text-sm italic animate-slideInUp delay-200">
                  "{currentAlert.message}"
                </div>
              )}
            </div>
          </div>

          {/* Celebration Effects */}
          {currentAlert.is_hyperemote && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-ping"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${30 + (i % 2) * 40}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '1s'
                  }}
                >
                  <Sparkles className="w-6 h-6 text-yellow-300" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Connection Status Debug */}
      <div className="fixed bottom-4 right-4 text-white text-xs bg-black/50 p-2 rounded">
        Polling: {connectionStatus} | Queue: {alertQueue.length} | Shown: {shownDonationIds.size} | Alert: {currentAlert ? 'Yes' : 'No'} | Init: {isInitialLoad ? 'Y' : 'N'}
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes bounceIn {
          0% {
            transform: translateX(-50%) translateY(-100%) scale(0.3);
            opacity: 0;
          }
          50% {
            transform: translateX(-50%) translateY(0) scale(1.1);
          }
          100% {
            transform: translateX(-50%) translateY(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
          }
          50% {
            box-shadow: 0 0 40px rgba(168, 85, 247, 0.8);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out 0.2s both;
        }

        .animate-slideInUp {
          animation: slideInUp 0.5s ease-out 0.4s both;
        }

        .delay-200 {
          animation-delay: 0.6s;
        }
      `}</style>
    </div>
  );
}