import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  created_at: string;
  payment_status: string;
  gif_url?: string;
  voice_url?: string;
  custom_sound_name?: string;
  custom_sound_url?: string;
  hyperemotes_enabled?: boolean;
}

const ChiaaGamingObsOverlay = () => {
  const { obsId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const showMessages = searchParams.get('showMessages') !== 'false';
  const showGoal = searchParams.get('showGoal') === 'true';
  const showAudio = searchParams.get('showAudio') === 'true'; // Changed: Only play audio when explicitly enabled
  const goalName = searchParams.get('goalName') || 'Support Goal';
  const goalTarget = Number(searchParams.get('goalTarget')) || 500;
  
  const [currentDonation, setCurrentDonation] = useState<Donation | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'show' | 'exit'>('enter');
  const [goalProgress, setGoalProgress] = useState<number>(0);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  // Trigger HyperEmotes effect
  const triggerHyperEmotes = (amount: number) => {
    const emojis = ['🚀', '✨', '🌟', '👏', '😍'];
    const container = document.getElementById('emote-container');
    if (!container) return;

    const count = Math.min(50, Math.floor(amount / 10)); // 1 emoji per ₹10, capped at 50

    for (let i = 0; i < count; i++) {
      const emoji = document.createElement('div');
      emoji.className = 'emote';
      emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];

      emoji.style.position = 'absolute';
      emoji.style.fontSize = '40px';
      emoji.style.left = Math.random() * window.innerWidth + 'px';
      emoji.style.top = (Math.random() * window.innerHeight * 0.5 + window.innerHeight * 0.4) + 'px';
      emoji.style.animation = 'floatUp 3s ease-out forwards';
      emoji.style.pointerEvents = 'none';

      container.appendChild(emoji);

      setTimeout(() => {
        if (emoji && emoji.parentNode) {
          emoji.remove();
        }
      }, 3000);
    }
  };

  // Validate OBS token
  useEffect(() => {
    const validateToken = async () => {
      if (!obsId) {
        setTokenValid(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('validate_obs_token', {
          p_token: obsId,
          p_admin_type: 'chiaa_gaming'
        });

        if (error || !data) {
          console.error("Invalid OBS token:", error);
          setTokenValid(false);
          return;
        }

        setTokenValid(true);
      } catch (error) {
        console.error("Error validating token:", error);
        setTokenValid(false);
      }
    };

    validateToken();
  }, [obsId]);

  // Calculate goal progress from today's successful donations only
  const fetchGoalProgress = async () => {
    try {
      const today = new Date();
      const todayStart = `${today.toISOString().split('T')[0]}T00:00:00`;
      const todayEnd = `${today.toISOString().split('T')[0]}T23:59:59`;
      
      const { data, error } = await supabase
        .from("chiaa_gaming_donations")
        .select("amount")
        .eq("payment_status", "success")
        .gte("created_at", todayStart)
        .lte("created_at", todayEnd);

      if (error) throw error;
      
      const total = data?.reduce((sum, donation) => sum + Number(donation.amount), 0) || 0;
      setGoalProgress(total);
      console.log("Goal progress updated for successful donations only:", total);
    } catch (error) {
      console.error("Error fetching goal progress:", error);
    }
  };

  useEffect(() => {
    if (!tokenValid) return;

    if (showGoal) {
      fetchGoalProgress();
    }
  }, [showGoal, tokenValid]);

  // Play audio if enabled and audio URLs exist
  const playDonationAudio = (donation: Donation) => {
    if (!showAudio) {
      console.log('Audio disabled in OBS overlay, audio will play in external audio player');
      return;
    }

    // Play voice message if available
    if (donation.voice_url) {
      const audio = new Audio(donation.voice_url);
      audio.volume = 0.7;
      audio.play().catch(error => {
        console.error('Error playing voice message:', error);
      });
    }

    // Play custom sound if available
    if (donation.custom_sound_url) {
      setTimeout(() => {
        const audio = new Audio(donation.custom_sound_url);
        audio.volume = 0.8;
        audio.play().catch(error => {
          console.error('Error playing custom sound:', error);
        });
      }, donation.voice_url ? 3000 : 0); // Wait 3 seconds if voice was played first
    }
  };

  useEffect(() => {
    if (!tokenValid) return;

    // Set up real-time subscription with 1 minute delay for OBS alerts
    const channel = supabase
      .channel(`chiaa-gaming-obs-overlay-${obsId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chiaa_gaming_donations',
          filter: 'payment_status=eq.success'
        },
        (payload) => {
          const newDonation = payload.new as Donation;
          console.log('New successful donation received in OBS overlay with 1 minute delay:', newDonation);
          
          // Update goal progress for successful payments
          if (showGoal) {
            setGoalProgress(prev => prev + Number(newDonation.amount));
          }
          
          // Show donation alert with 1 minute delay if messages are enabled
          if (showMessages) {
            setTimeout(() => {
              console.log('Showing delayed donation alert in OBS overlay');
              setAnimationPhase('enter');
              setCurrentDonation(newDonation);
              setIsVisible(true);
              
              // Play audio only if enabled in this overlay
              if (showAudio) {
                playDonationAudio(newDonation);
              }
              
              // Trigger HyperEmotes if enabled
              if (newDonation.hyperemotes_enabled) {
                triggerHyperEmotes(Number(newDonation.amount));
              }
              
              setTimeout(() => setAnimationPhase('show'), 500);
              
              setTimeout(() => {
                setAnimationPhase('exit');
                setTimeout(() => {
                  setIsVisible(false);
                  setTimeout(() => {
                    setCurrentDonation(null);
                    setAnimationPhase('enter');
                  }, 1000);
                }, 500);
              }, 12000);
            }, 0); // Show immediately
          }
        }
      )
      .subscribe();

    console.log('Chiaa Gaming OBS overlay real-time subscription set up with 1 minute delay');

    return () => {
      supabase.removeChannel(channel);
    };
  }, [obsId, showMessages, showGoal, showAudio, tokenValid]);

  // Show loading or error state
  if (tokenValid === null) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/90">
        <div className="text-white text-xl">Validating access...</div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/90">
        <div className="text-red-400 text-xl">Invalid or expired OBS token</div>
      </div>
    );
  }

  const getAnimationClasses = () => {
    switch (animationPhase) {
      case 'enter':
        return 'opacity-0 scale-0 translate-x-full rotate-12';
      case 'show':
        return 'opacity-100 scale-100 translate-x-0 rotate-0';
      case 'exit':
        return 'opacity-0 scale-75 -translate-y-8 rotate-3';
      default:
        return 'opacity-100 scale-100 translate-x-0 rotate-0';
    }
  };

  const goalPercentage = Math.min((goalProgress / goalTarget) * 100, 100);

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ background: 'transparent' }}
    >
      {/* HyperEmotes Container */}
      <div 
        id="emote-container" 
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1000
        }}
      />
      
      {/* CSS for HyperEmotes Animation and Alert Styling */}
      <style>
        {`
          @keyframes floatUp {
            0% {
              transform: translateY(0);
              opacity: 1;
            }
            100% {
              transform: translateY(-600px);
              opacity: 0;
            }
          }
          .donation-alert-card {
            background: linear-gradient(135deg, rgba(139, 69, 19, 0.9), rgba(255, 140, 0, 0.8));
            border: 2px solid rgba(255, 215, 0, 0.6);
            border-radius: 16px;
            padding: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          }
          .donation-alert-content {
            color: white;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
          }
          .gif-glow-outline {
            border: 3px solid rgba(255, 215, 0, 0.8);
            border-radius: 12px;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
          }
        `}
      </style>
      {/* Goal Display */}
      {showGoal && (
        <div className="absolute top-4 left-4 w-80 z-20">
          <div className="bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-2xl">
            <div className="text-white">
              <h3 className="text-lg font-bold mb-2">{goalName}</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>₹{goalProgress.toLocaleString()}</span>
                  <span>₹{goalTarget.toLocaleString()}</span>
                </div>
                <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-1000 ease-out"
                    style={{ width: `${goalPercentage}%` }}
                  />
                </div>
                <div className="text-center text-sm font-semibold">
                  {goalPercentage.toFixed(1)}% Complete
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Donation Alert */}
      {currentDonation && showMessages && (
        <div className="absolute top-4 right-4 w-80 max-w-sm z-20">
          <div 
            className={`
              donation-alert-card w-full h-auto min-h-[200px]
              transition-all duration-700 ease-out
              ${getAnimationClasses()}
            `}
          >
            <div className="donation-alert-content w-full">
              {/* Header */}
              <div className="flex items-center justify-center mb-3">
                <h3 className="text-lg font-bold">New Donation! 🎉</h3>
              </div>
              
              {/* Donation details */}
              <div className="space-y-2">
                <div className="text-center">
                  <div className="text-xl font-bold text-cyan-300">
                    ₹{Number(currentDonation.amount).toLocaleString()}
                  </div>
                  <div className="text-sm font-medium">
                    from {currentDonation.name}
                  </div>
                </div>
                
                {currentDonation.message && (
                  <div className="bg-black/20 rounded-lg p-2 mt-3">
                    <p className="text-xs italic text-center">"{currentDonation.message}"</p>
                  </div>
                )}

                {/* GIF display with glow outline */}
                {currentDonation.gif_url && (
                  <div className="flex justify-center mt-3">
                    <div className="gif-glow-outline">
                      <img 
                        src={currentDonation.gif_url} 
                        alt="Donation GIF" 
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  </div>
                )}

                {/* Audio indicators */}
                {(currentDonation.voice_url || currentDonation.custom_sound_url) && (
                  <div className="flex justify-center gap-2 text-xs text-cyan-200 mt-2">
                    {currentDonation.voice_url && (
                      <span>{showAudio ? '🎤' : '🔇'}</span>
                    )}
                    {currentDonation.custom_sound_url && (
                      <span>{showAudio ? '🔊' : '🔇'}</span>
                    )}
                  </div>
                )}

                {/* HyperEmotes indicator */}
                {currentDonation.hyperemotes_enabled && (
                  <div className="flex justify-center text-xs text-purple-200 mt-2">
                    <span className="animate-pulse">✨ HyperEmotes Active! ✨</span>
                  </div>
                )}
              </div>
              
              {/* Thank you message */}
              <div className="text-center mt-3">
                <div className="text-xs text-cyan-100">
                  Thank you! ❤️
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChiaaGamingObsOverlay;
