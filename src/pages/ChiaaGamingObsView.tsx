
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Sparkles, Music } from "lucide-react";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  include_sound: boolean;
  created_at: string;
  payment_status: string;
}

const ChiaaGamingObsView = () => {
  const [latestDonation, setLatestDonation] = useState<Donation | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [obsStartTime] = useState(new Date().toISOString());

  useEffect(() => {
    // Set up real-time subscription for new donations
    const channel = supabase
      .channel('chiaa_gaming_obs_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chiaa_gaming_donations'
        },
        (payload) => {
          console.log('New donation received:', payload);
          const newDonation = payload.new as Donation;
          
          // Only show donations created after OBS view was loaded
          if (newDonation.created_at > obsStartTime && 
              (newDonation.payment_status === 'completed' || newDonation.payment_status === 'success')) {
            handleNewDonation(newDonation);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [obsStartTime]);

  const handleNewDonation = (donation: Donation) => {
    console.log('Handling new donation:', donation);
    setLatestDonation(donation);
    setShowAlert(true);
    
    // Play sound if requested
    if (donation.include_sound) {
      playNotificationSound();
    }

    // Hide alert after 15 seconds
    setTimeout(() => {
      setShowAlert(false);
    }, 15000);
  };

  const playNotificationSound = () => {
    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  return (
    <div className="w-full h-screen bg-transparent relative overflow-hidden">
      {/* Donation Alert with transparent background */}
      {showAlert && latestDonation && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-gradient-to-r from-pink-500/70 to-purple-600/70 backdrop-blur-md p-6 rounded-2xl border border-white/30 shadow-2xl max-w-md">
            <div className="flex items-center space-x-3 mb-3">
              <Heart className="h-6 w-6 text-white animate-pulse" />
              <h3 className="text-white font-bold text-lg drop-shadow-lg">New Donation!</h3>
              <Sparkles className="h-6 w-6 text-white animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium drop-shadow-md">{latestDonation.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="bg-white/30 text-white px-3 py-1 rounded-full font-bold drop-shadow-md">
                    ₹{latestDonation.amount}
                  </span>
                  {latestDonation.include_sound && (
                    <Music className="h-4 w-4 text-white" />
                  )}
                </div>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg border border-white/20">
                <p className="text-white text-sm leading-relaxed drop-shadow-md">
                  {latestDonation.message}
                </p>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-white/90 text-xs drop-shadow-md">Thank you for your support! 💖</p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Hearts Animation */}
      {showAlert && (
        <div className="fixed inset-0 pointer-events-none z-30">
          {Array.from({ length: 6 }).map((_, i) => (
            <Heart
              key={i}
              className={`absolute text-pink-400 animate-float-heart opacity-80 drop-shadow-lg`}
              size={20 + Math.random() * 20}
              style={{
                left: `${10 + Math.random() * 80}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <style>{`
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
        
        @keyframes float-heart {
          0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) rotate(360deg);
            opacity: 0;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.5s ease-out;
        }
        
        .animate-float-heart {
          animation: float-heart linear forwards;
        }
      `}</style>
    </div>
  );
};

export default ChiaaGamingObsView;
