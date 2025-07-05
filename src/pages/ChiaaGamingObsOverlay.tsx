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
          console.log('New successful donation received in OBS overlay:', newDonation);
          console.log('OBS Environment check:', {
            userAgent: navigator.userAgent,
            isOBS: navigator.userAgent.includes('OBS'),
            showMessages,
            showGoal,
            showAudio
          });
          
          // Update goal progress for successful payments
          if (showGoal) {
            setGoalProgress(prev => prev + Number(newDonation.amount));
          }
          
          // Show donation alert immediately if messages are enabled
          if (showMessages) {
            console.log('Showing donation alert in OBS overlay');
            setAnimationPhase('enter');
            setCurrentDonation(newDonation);
            setIsVisible(true);
            
            // Play audio only if enabled in this overlay
            if (showAudio) {
              playDonationAudio(newDonation);
            }
            
            // Trigger HyperEmotes if enabled
            if (newDonation.hyperemotes_enabled) {
              console.log('Triggering HyperEmotes for amount:', newDonation.amount);
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
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}>
        <div style={{ color: 'white', fontSize: '20px' }}>Validating access...</div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}>
        <div style={{ color: '#ff6b6b', fontSize: '20px' }}>Invalid or expired OBS token</div>
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
            background: rgba(0, 0, 0, 0.8);
            border-radius: 12px;
            padding: 12px;
            max-width: 280px;
          }
          .donation-alert-content {
            color: #FFFFFF;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
          }
          .gif-glow-outline {
            border: 2px solid transparent;
            border-radius: 8px;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57) border-box;
            background-clip: padding-box, border-box;
            animation: gradient-border 3s ease infinite;
          }
          @keyframes gradient-border {
            0%, 100% { 
              background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57) border-box;
            }
            25% { 
              background: linear-gradient(45deg, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff6b6b) border-box;
            }
            50% { 
              background: linear-gradient(45deg, #45b7d1, #96ceb4, #feca57, #ff6b6b, #4ecdc4) border-box;
            }
            75% { 
              background: linear-gradient(45deg, #96ceb4, #feca57, #ff6b6b, #4ecdc4, #45b7d1) border-box;
            }
          }
        `}
      </style>
      {/* Goal Display */}
      {showGoal && (
        <div style={{ position: 'absolute', top: '16px', left: '16px', width: '320px', zIndex: 20 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.9), rgba(236, 72, 153, 0.9))',
            borderRadius: '16px',
            padding: '16px',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ color: 'white' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>{goalName}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                <span>₹{goalProgress.toLocaleString()}</span>
                <span>₹{goalTarget.toLocaleString()}</span>
              </div>
              <div style={{
                width: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '50px',
                height: '12px',
                overflow: 'hidden',
                marginBottom: '8px'
              }}>
                <div style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #4ade80, #3b82f6)',
                  width: `${goalPercentage}%`,
                  transition: 'width 1000ms ease-out'
                }} />
              </div>
              <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                {goalPercentage.toFixed(1)}% Complete
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Donation Alert */}
      {currentDonation && showMessages && (
        <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 20 }}>
          <div 
            className={`donation-alert-card transition-all duration-700 ease-out ${getAnimationClasses()}`}
          >
            <div className="donation-alert-content">
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>New Donation! 🎉</h3>
              </div>
              
              {/* Donation details */}
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#00bcd4' }}>
                  ₹{Number(currentDonation.amount).toLocaleString()}
                </div>
                <div style={{ fontSize: '12px' }}>
                  from {currentDonation.name}
                </div>
              </div>
              
              {currentDonation.message && (
                <div style={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                  borderRadius: '6px', 
                  padding: '6px', 
                  marginBottom: '8px' 
                }}>
                  <p style={{ fontSize: '10px', fontStyle: 'italic', textAlign: 'center', margin: 0 }}>
                    "{currentDonation.message}"
                  </p>
                </div>
              )}

              {/* GIF display with gradient border */}
              {currentDonation.gif_url && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                  <div className="gif-glow-outline">
                    <img 
                      src={currentDonation.gif_url} 
                      alt="Donation GIF" 
                      style={{ 
                        width: '100px', 
                        height: '100px', 
                        objectFit: 'cover', 
                        borderRadius: '6px',
                        display: 'block'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Audio indicators */}
              {(currentDonation.voice_url || currentDonation.custom_sound_url) && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: '8px', 
                  fontSize: '10px', 
                  color: '#00bcd4',
                  marginBottom: '8px'
                }}>
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
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  fontSize: '10px', 
                  color: '#bb86fc',
                  marginBottom: '8px'
                }}>
                  <span className="animate-pulse">✨ HyperEmotes Active! ✨</span>
                </div>
              )}
              
              {/* Thank you message */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#e0f7fa' }}>
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
