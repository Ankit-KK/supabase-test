
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Sparkles, Gamepad2, Music } from "lucide-react";

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
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);

  useEffect(() => {
    fetchRecentDonations();

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
          const newDonation = payload.new as Donation;
          if (newDonation.payment_status === 'completed') {
            handleNewDonation(newDonation);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRecentDonations = async () => {
    try {
      const { data, error } = await supabase
        .from("chiaa_gaming_donations")
        .select("*")
        .eq("payment_status", "completed")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentDonations(data || []);
    } catch (error) {
      console.error("Error fetching recent donations:", error);
    }
  };

  const handleNewDonation = (donation: Donation) => {
    setLatestDonation(donation);
    setShowAlert(true);
    
    // Play sound if requested
    if (donation.include_sound) {
      playNotificationSound();
    }

    // Hide alert after 8 seconds
    setTimeout(() => {
      setShowAlert(false);
    }, 8000);

    // Update recent donations
    fetchRecentDonations();
  };

  const playNotificationSound = () => {
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
  };

  return (
    <div className="w-full h-screen bg-transparent relative overflow-hidden">
      {/* Donation Alert */}
      {showAlert && latestDonation && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-gradient-to-r from-pink-500/95 to-purple-600/95 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-2xl max-w-md">
            <div className="flex items-center space-x-3 mb-3">
              <Heart className="h-6 w-6 text-white animate-pulse" />
              <h3 className="text-white font-bold text-lg">New Donation!</h3>
              <Sparkles className="h-6 w-6 text-white animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/90 font-medium">{latestDonation.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="bg-white/20 text-white px-3 py-1 rounded-full font-bold">
                    ₹{latestDonation.amount}
                  </span>
                  {latestDonation.include_sound && (
                    <Music className="h-4 w-4 text-white" />
                  )}
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                <p className="text-white text-sm leading-relaxed">
                  {latestDonation.message}
                </p>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-white/80 text-xs">Thank you for your support! 💖</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Donations Ticker */}
      <div className="fixed bottom-4 left-4 right-4 z-40">
        {recentDonations.length > 0 && (
          <div className="bg-gradient-to-r from-pink-500/80 to-purple-600/80 backdrop-blur-lg p-4 rounded-xl border border-white/20 shadow-lg">
            <div className="flex items-center space-x-3 mb-2">
              <Gamepad2 className="h-5 w-5 text-white" />
              <h4 className="text-white font-semibold">Recent Support 💕</h4>
            </div>
            
            <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
              {recentDonations.slice(0, 3).map((donation) => (
                <div
                  key={donation.id}
                  className="flex-shrink-0 bg-white/10 backdrop-blur-sm p-3 rounded-lg min-w-[200px]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-medium text-sm">{donation.name}</span>
                    <span className="text-white text-xs bg-white/20 px-2 py-1 rounded">
                      ₹{donation.amount}
                    </span>
                  </div>
                  <p className="text-white/90 text-xs truncate">
                    {donation.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Hearts Animation */}
      {showAlert && (
        <div className="fixed inset-0 pointer-events-none z-30">
          {Array.from({ length: 6 }).map((_, i) => (
            <Heart
              key={i}
              className={`absolute text-pink-400 animate-float-heart opacity-80`}
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
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default ChiaaGamingObsView;
