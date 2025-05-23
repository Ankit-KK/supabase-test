
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DraggableResizableBox } from "@/components/DraggableResizableBox";
import { Heart, Sparkles, Star } from "lucide-react";

const ChiaGamingObsView = () => {
  const { id } = useParams();
  const [latestDonation, setLatestDonation] = useState<any>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    // Fetch latest donation
    fetchLatestDonation();

    // Set up real-time subscription
    const channel = supabase
      .channel(`chia_gaming_obs_${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chia_gaming_donations",
        },
        (payload) => {
          console.log("New donation received:", payload);
          if (payload.new.payment_status === "paid") {
            setLatestDonation(payload.new);
            triggerAnimation();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchLatestDonation = async () => {
    try {
      const { data, error } = await supabase
        .from("chia_gaming_donations")
        .select("*")
        .eq("payment_status", "paid")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setLatestDonation(data[0]);
      }
    } catch (error) {
      console.error("Error fetching latest donation:", error);
    }
  };

  const triggerAnimation = () => {
    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 5000);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent">
      {/* Floating hearts animation */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`absolute animate-float-up opacity-30 ${
              showAnimation ? 'animate-pulse' : ''
            }`}
            style={{
              left: `${10 + i * 15}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: '3s'
            }}
          >
            <Heart className="text-pink-400" size={20 + i * 5} />
          </div>
        ))}
      </div>

      <DraggableResizableBox
        id={`chia-gaming-obs-${id}`}
        defaultPosition={{ x: 50, y: 50 }}
        defaultSize={{ width: 400, height: 200 }}
      >
        <div 
          className={`p-6 rounded-xl transition-all duration-1000 ${
            showAnimation 
              ? 'bg-gradient-to-r from-pink-400/90 to-purple-500/90 shadow-2xl shadow-pink-500/50 scale-110' 
              : 'bg-gradient-to-r from-pink-300/80 to-purple-400/80 shadow-lg shadow-pink-400/30'
          }`}
        >
          {latestDonation ? (
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <Heart className="h-6 w-6 text-white animate-pulse" />
                <h2 className="text-xl font-bold text-white">New Love! 💖</h2>
                <Sparkles className="h-6 w-6 text-white animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg font-semibold text-white">{latestDonation.name}</span>
                  <Star className="h-4 w-4 text-yellow-300" />
                </div>
                <div className="text-2xl font-bold text-white bg-white/20 rounded-full px-4 py-1">
                  ₹{latestDonation.amount}
                </div>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 max-h-20 overflow-hidden">
                <p className="text-white text-sm leading-relaxed">
                  {latestDonation.message}
                </p>
              </div>
              
              <div className="flex justify-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Heart 
                    key={i} 
                    className="h-4 w-4 text-pink-200 animate-bounce" 
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <Heart className="h-6 w-6 text-white" />
                <h2 className="text-xl font-bold text-white">Chia Gaming</h2>
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <p className="text-white/80">Waiting for love and support! 💕</p>
              <div className="flex justify-center space-x-1">
                {[...Array(3)].map((_, i) => (
                  <Heart 
                    key={i} 
                    className="h-4 w-4 text-pink-200 animate-pulse" 
                    style={{ animationDelay: `${i * 0.3}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </DraggableResizableBox>

      <style jsx>{`
        @keyframes float-up {
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
        .animate-float-up {
          animation: float-up 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ChiaGamingObsView;
