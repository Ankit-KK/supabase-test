
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
}

const ChiaaGamingObsOverlay = () => {
  const { obsId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const showMessages = searchParams.get('showMessages') !== 'false';
  const showGoal = searchParams.get('showGoal') === 'true';
  const showAudio = searchParams.get('showAudio') !== 'false'; // New parameter
  const goalName = searchParams.get('goalName') || 'Support Goal';
  const goalTarget = Number(searchParams.get('goalTarget')) || 500;
  
  const [currentDonation, setCurrentDonation] = useState<Donation | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'show' | 'exit'>('enter');
  const [goalProgress, setGoalProgress] = useState<number>(0);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

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
      console.log('Audio disabled in OBS overlay, skipping audio playback');
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
              
              // Play audio if enabled
              playDonationAudio(newDonation);
              
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
            }, 60000); // 1 minute delay
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
        <div className="absolute top-4 right-4 w-96 max-w-md z-20">
          <div 
            className={`
              relative overflow-hidden rounded-2xl shadow-2xl
              transition-all duration-700 ease-out
              ${getAnimationClasses()}
            `}
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 animate-gradient-x"></div>
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            
            {/* Content */}
            <div className="relative p-6 text-white">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-2xl font-bold transition-all duration-500 ${animationPhase === 'show' ? 'animate-pulse-glow' : ''}`}>
                  New Donation!
                </h3>
                <div className={`text-4xl transition-all duration-700 ${animationPhase === 'show' ? 'animate-bounce' : ''}`}>
                  🎉
                </div>
              </div>
              
              {/* Donation details */}
              <div className="space-y-3">
                <div className={`flex justify-between items-center transition-all duration-500 delay-200 ${animationPhase === 'enter' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                  <span className="text-lg font-semibold">{currentDonation.name}</span>
                  <span className={`text-3xl font-bold text-yellow-300 transition-all duration-300 ${animationPhase === 'show' ? 'animate-pulse scale-110' : ''}`}>
                    ₹{Number(currentDonation.amount).toLocaleString()}
                  </span>
                </div>
                
                {currentDonation.message && (
                  <div className={`bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-white/20 transition-all duration-500 delay-400 ${animationPhase === 'enter' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                    <p className="text-sm italic">"{currentDonation.message}"</p>
                  </div>
                )}

                {/* Audio indicators */}
                {(currentDonation.voice_url || currentDonation.custom_sound_url) && showAudio && (
                  <div className={`flex items-center gap-2 text-xs text-blue-200 transition-all duration-500 delay-500 ${animationPhase === 'enter' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                    {currentDonation.voice_url && <span>🎤 Voice Message</span>}
                    {currentDonation.custom_sound_url && <span>🔊 Custom Sound</span>}
                  </div>
                )}
              </div>
              
              {/* Thank you message */}
              <div className={`mt-4 text-center transition-all duration-500 delay-600 ${animationPhase === 'enter' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                <div className={`inline-block bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm border border-white/30 ${animationPhase === 'show' ? 'animate-float' : ''}`}>
                  Thank you for your support! ❤️
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-ping"></div>
            <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-pink-400 rounded-full animate-pulse"></div>
            
            {/* Progress bar animation */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-[12000ms] ease-linear"
                style={{ 
                  width: animationPhase === 'show' ? '0%' : '100%',
                  transform: animationPhase === 'exit' ? 'scaleX(0)' : 'scaleX(1)',
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Audio status indicator when audio is disabled */}
      {!showAudio && (
        <div className="absolute bottom-4 right-4 bg-orange-600/80 text-white px-3 py-1 rounded-full text-xs">
          Audio: External Player
        </div>
      )}
    </div>
  );
};

export default ChiaaGamingObsOverlay;
