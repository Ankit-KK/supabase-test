
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { validateObsAccess, logSecurityEvent } from "@/services/secureAuth";

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
  include_sound?: boolean;
}

const ChiaaGamingObsOverlay = () => {
  const { obsId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const showMessages = searchParams.get('showMessages') !== 'false';
  const showGoal = searchParams.get('showGoal') === 'true';
  const goalName = searchParams.get('goalName') || 'Gaming Goal';
  const goalTarget = Number(searchParams.get('goalTarget')) || 1000;
  
  const [currentDonation, setCurrentDonation] = useState<Donation | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'show' | 'exit'>('enter');
  const [goalProgress, setGoalProgress] = useState<number>(0);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(true);

  // Validate token access on component mount
  useEffect(() => {
    const validateAccess = async () => {
      if (!token) {
        console.error('No token provided for OBS overlay access');
        await logSecurityEvent('OBS_ACCESS_NO_TOKEN', { table: 'obs_access_tokens' });
        setIsValidating(false);
        return;
      }

      try {
        const isValid = await validateObsAccess(token, 'chiaa_gaming');
        
        if (isValid) {
          setIsAuthorized(true);
          await logSecurityEvent('OBS_ACCESS_GRANTED', { 
            table: 'obs_access_tokens',
            obsId 
          });
        } else {
          console.error('Invalid or expired token for OBS overlay access');
          await logSecurityEvent('OBS_ACCESS_DENIED', { 
            table: 'obs_access_tokens',
            obsId,
            token: token.substring(0, 8) + '...' // Log partial token for debugging
          });
        }
      } catch (error) {
        console.error('Token validation error:', error);
        await logSecurityEvent('OBS_ACCESS_ERROR', { 
          table: 'obs_access_tokens',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      } finally {
        setIsValidating(false);
      }
    };

    validateAccess();
  }, [token, obsId]);

  // Calculate goal progress from today's donations
  const fetchGoalProgress = async () => {
    if (!isAuthorized) return;
    
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
    } catch (error) {
      console.error("Error fetching goal progress:", error);
      await logSecurityEvent('OBS_GOAL_FETCH_ERROR', { 
        table: 'chiaa_gaming_donations',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  useEffect(() => {
    if (showGoal && isAuthorized) {
      fetchGoalProgress();
    }
  }, [showGoal, isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) return;
    
    // Set up real-time subscription for new donations
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
        async (payload) => {
          const newDonation = payload.new as Donation;
          console.log('New donation received in secure OBS overlay:', newDonation);
          
          // Log donation display event
          await logSecurityEvent('OBS_DONATION_DISPLAYED', { 
            table: 'chiaa_gaming_donations',
            recordId: newDonation.id,
            obsId 
          });
          
          // Update goal progress
          if (showGoal) {
            setGoalProgress(prev => prev + Number(newDonation.amount));
          }
          
          // Show donation alert if messages are enabled
          if (showMessages) {
            setAnimationPhase('enter');
            setCurrentDonation(newDonation);
            setIsVisible(true);
            
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
          }
        }
      )
      .subscribe();

    console.log('Secure OBS overlay real-time subscription set up');

    return () => {
      supabase.removeChannel(channel);
    };
  }, [obsId, showMessages, showGoal, isAuthorized]);

  // Show loading state while validating
  if (isValidating) {
    return (
      <div 
        className="fixed inset-0 pointer-events-none flex items-center justify-center"
        style={{ background: 'transparent' }}
      >
        <div className="bg-black/80 text-white p-4 rounded-lg">
          <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm">Validating access...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not authorized
  if (!isAuthorized) {
    return (
      <div 
        className="fixed inset-0 pointer-events-none flex items-center justify-center"
        style={{ background: 'transparent' }}
      >
        <div className="bg-red-900/90 text-white p-6 rounded-lg border border-red-500">
          <div className="text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-sm opacity-80">Invalid or expired security token</p>
          </div>
        </div>
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
      className="fixed inset-0 pointer-events-none"
      style={{ background: 'transparent' }}
    >
      {/* Goal Display */}
      {showGoal && (
        <div className="absolute top-4 left-4 w-80">
          <div className="bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-2xl">
            <div className="text-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold">{goalName}</h3>
                <div className="text-xs bg-green-500/20 px-2 py-1 rounded border border-green-500/30">
                  🔒 Secure
                </div>
              </div>
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
        <div className="absolute top-4 right-4 w-96 max-w-md">
          <div 
            className={`
              relative overflow-hidden rounded-2xl shadow-2xl
              transition-all duration-700 ease-out
              ${getAnimationClasses()}
            `}
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 animate-gradient-x"></div>
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            
            {/* Content */}
            <div className="relative p-6 text-white">
              {/* Header with bouncing emoji and security indicator */}
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-2xl font-bold transition-all duration-500 ${animationPhase === 'show' ? 'animate-pulse-glow' : ''}`}>
                  New Donation!
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="text-xs bg-green-500/20 px-2 py-1 rounded border border-green-500/30">
                    🔒 Secure
                  </div>
                  <div className={`text-4xl transition-all duration-700 ${animationPhase === 'show' ? 'animate-bounce' : ''}`}>
                    🎉
                  </div>
                </div>
              </div>
              
              {/* Donation details with staggered animations */}
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
                
                {/* Premium features display */}
                {(currentDonation.gif_url || currentDonation.voice_url || currentDonation.custom_sound_name) && (
                  <div className={`flex flex-wrap gap-2 transition-all duration-500 delay-500 ${animationPhase === 'enter' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                    {currentDonation.gif_url && (
                      <div className="text-xs bg-purple-500/20 px-2 py-1 rounded border border-purple-500/30">
                        🎆 GIF
                      </div>
                    )}
                    {currentDonation.voice_url && (
                      <div className="text-xs bg-blue-500/20 px-2 py-1 rounded border border-blue-500/30">
                        🎤 Voice
                      </div>
                    )}
                    {currentDonation.custom_sound_name && (
                      <div className="text-xs bg-orange-500/20 px-2 py-1 rounded border border-orange-500/30">
                        🔊 Sound
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Thank you message with floating animation */}
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
    </div>
  );
};

export default ChiaaGamingObsOverlay;
