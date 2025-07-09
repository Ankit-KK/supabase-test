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
  include_sound?: boolean;
  review_status?: string;
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
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  
  // Queue system for managing multiple donations
  const [donationQueue, setDonationQueue] = useState<Donation[]>([]);
  const [isDisplaying, setIsDisplaying] = useState(false);

  // Enhanced HyperEmotes effect with multiple patterns and effects
  const triggerHyperEmotes = (amount: number) => {
    // Custom emotes from chiaa-emotes bucket
    const emoteUrls = [
      'https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/emojis1-Photoroom.png',
      'https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom.png',
      'https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(9).png',
      'https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(5).png',
      'https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(4).png',
      'https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(10).png',
      'https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(3).png',
      'https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(2).png',
      'https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(8).png',
      'https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(6).png',
      'https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(1).png',
      'https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(7).png'
    ];
    const container = document.getElementById('emote-container');
    if (!container) return;

    const count = Math.min(80, Math.floor(amount / 8)); // More emojis for better effect
    const animationPatterns = ['floatUp', 'fireworks', 'spiral', 'bounce', 'burst'];
    
    // Determine emoji size based on donation amount
    const getEmojiSize = (amount: number) => {
       if (amount >= 1) return Math.random() * 40 + 70; // 70-110px for high amounts
       if (amount >= 1) return Math.random() * 30 + 60; // 60-90px for medium amounts
       if (amount >= 1) return Math.random() * 25 + 50; // 50-75px for low-medium amounts
      return Math.random() * 20 + 40; // 40-60px for low amounts
    };

    // Create emojis in waves for staggered timing
    const wavesCount = Math.ceil(count / 15); // Max 15 emojis per wave
    
    for (let wave = 0; wave < wavesCount; wave++) {
      const waveDelay = wave * 200; // 200ms between waves
      const emojisInWave = Math.min(15, count - (wave * 15));
      
      setTimeout(() => {
        for (let i = 0; i < emojisInWave; i++) {
          const emote = document.createElement('img');
          const selectedEmoteUrl = emoteUrls[Math.floor(Math.random() * emoteUrls.length)];
          const pattern = animationPatterns[Math.floor(Math.random() * animationPatterns.length)];
          const size = getEmojiSize(amount);
          const animationDuration = 3 + Math.random() * 2; // 3-5 seconds
          
          emote.className = `emote emote-${pattern}`;
          emote.src = selectedEmoteUrl;
          emote.alt = 'Custom emote';
          
          // Base styles
          emote.style.position = 'absolute';
          emote.style.width = `${size}px`;
          emote.style.height = `${size}px`;
          emote.style.objectFit = 'contain';
          emote.style.pointerEvents = 'none';
          emote.style.zIndex = '1000';
          
          // Glow effects for custom emotes
          emote.style.filter = `
            drop-shadow(0 0 ${size/6}px rgba(255, 255, 255, 0.8))
            drop-shadow(0 0 ${size/3}px rgba(147, 51, 234, 0.6))
          `;
          
          // Set starting position and animation based on pattern
          switch (pattern) {
            case 'fireworks':
              // Start from center and explode outward
              emote.style.left = '50%';
              emote.style.top = '50%';
              emote.style.animation = `fireworksExplode ${animationDuration}s ease-out forwards`;
              emote.style.setProperty('--end-x', `${Math.random() * 100}%`);
              emote.style.setProperty('--end-y', `${Math.random() * 100}%`);
              break;
              
            case 'spiral':
              // Spiral motion from random edge
              emote.style.left = Math.random() * 100 + '%';
              emote.style.top = '100%';
              emote.style.animation = `spiralUp ${animationDuration}s ease-in-out forwards`;
              break;
              
            case 'bounce':
              // Bouncing side to side while going up
              emote.style.left = Math.random() * 100 + '%';
              emote.style.top = '100%';
              emote.style.animation = `bounceUp ${animationDuration}s ease-in-out forwards`;
              break;
              
            case 'burst':
              // Quick burst from random positions
              emote.style.left = Math.random() * 100 + '%';
              emote.style.top = Math.random() * 100 + '%';
              emote.style.animation = `burstOut ${animationDuration * 0.8}s ease-out forwards`;
              break;
              
            default: // floatUp
              emote.style.left = Math.random() * 100 + '%';
              emote.style.top = '110%';
              emote.style.animation = `floatUp ${animationDuration}s ease-out forwards`;
              break;
          }
          
          container.appendChild(emote);
          
          // Clean up after animation
          setTimeout(() => {
            if (emote && emote.parentNode) {
              emote.remove();
            }
          }, animationDuration * 1000 + 500);
        }
      }, waveDelay);
    }
  };

  // Validate OBS token periodically
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
          setIsConnected(false);
          return;
        }

        setTokenValid(true);
        console.log('Token validated successfully');
      } catch (error) {
        console.error("Error validating token:", error);
        setTokenValid(false);
        setIsConnected(false);
      }
    };

    // Initial validation
    validateToken();
    
    // Periodic validation every 5 minutes
    const validationInterval = setInterval(validateToken, 5 * 60 * 1000);
    
    return () => clearInterval(validationInterval);
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

    // Play custom sound if selected, otherwise play voicy_alert
    if (donation.custom_sound_url) {
      const customAudio = new Audio(donation.custom_sound_url);
      customAudio.volume = 0.8;
      customAudio.play().catch(error => {
        console.error('Error playing custom sound:', error);
      });
    } else {
      // Only play voicy_alert if no custom sound was selected
      const voicyAlertUrl = "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/custom-sounds/Voicy_Alert.mp3";
      const voicyAlert = new Audio(voicyAlertUrl);
      voicyAlert.volume = 0.8;
      voicyAlert.play().catch(error => {
        console.error('Error playing voicy_alert:', error);
      });
    }

    // Play voice message if available (after alert sound)
    if (donation.voice_url) {
      setTimeout(() => {
        const audio = new Audio(donation.voice_url);
        audio.volume = 0.7;
        audio.play().catch(error => {
          console.error('Error playing voice message:', error);
        });
      }, 1000); // Wait 1 second after alert sound
    }
  };

  // Queue management functions
  const addToQueue = (donation: Donation) => {
    setDonationQueue(prev => {
      // Check if donation is already in queue to prevent duplicates
      const exists = prev.some(d => d.id === donation.id);
      if (exists) {
        console.log('Donation already in queue, skipping:', donation.id);
        return prev;
      }
      console.log('Adding donation to queue:', donation.id, 'Queue length will be:', prev.length + 1);
      return [...prev, donation];
    });
  };

  const processNextInQueue = () => {
    if (donationQueue.length === 0 || isDisplaying) {
      return;
    }

    const nextDonation = donationQueue[0];
    console.log('Processing next donation from queue:', nextDonation.id);
    
    // Remove from queue and start displaying
    setDonationQueue(prev => prev.slice(1));
    setIsDisplaying(true);
    
    // Update goal progress
    if (showGoal && nextDonation.payment_status === 'success') {
      setGoalProgress(prev => prev + Number(nextDonation.amount));
    }
    
    // Show donation alert if messages are enabled
    if (showMessages) {
      console.log('Displaying queued donation alert in OBS overlay');
      setAnimationPhase('enter');
      setCurrentDonation(nextDonation);
      setIsVisible(true);
      
      // Play audio only if enabled in this overlay
      if (showAudio) {
        playDonationAudio(nextDonation);
      }
      
      // Trigger HyperEmotes if enabled
      if (nextDonation.hyperemotes_enabled) {
        console.log('Triggering HyperEmotes for queued donation:', nextDonation.amount);
        triggerHyperEmotes(Number(nextDonation.amount));
      }
      
      setTimeout(() => setAnimationPhase('show'), 500);
      
      // Hide donation after 12 seconds and mark as not displaying
      setTimeout(() => {
        setAnimationPhase('exit');
        setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => {
            setCurrentDonation(null);
            setAnimationPhase('enter');
            setIsDisplaying(false); // Mark as done displaying
          }, 1000);
        }, 500);
      }, 12000);
    } else {
      // If messages are disabled, just mark as done
      setIsDisplaying(false);
    }
  };

  // Process queue when donations are added or when current display finishes
  useEffect(() => {
    if (!isDisplaying && donationQueue.length > 0) {
      // Add a small delay to prevent rapid-fire displays
      const timer = setTimeout(() => {
        processNextInQueue();
      }, 1500); // 1.5 second gap between donations
      
      return () => clearTimeout(timer);
    }
  }, [donationQueue, isDisplaying, showMessages, showGoal, showAudio]);

  useEffect(() => {
    if (!tokenValid) return;

    let channel: any = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let heartbeatInterval: NodeJS.Timeout | null = null;
    let currentReconnectAttempts = 0;
    const maxReconnectAttempts = 3;
    let isCleaningUp = false;

    const setupSubscription = () => {
      if (isCleaningUp) return;
      
      console.log(`Setting up real-time subscription (attempt ${currentReconnectAttempts + 1})`);
      
      // Clean up existing channel and heartbeat
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }

      // Set up real-time subscription with 1 minute delay for OBS alerts
      channel = supabase
        .channel(`chiaa-gaming-obs-overlay-${obsId}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chiaa_gaming_donations',
            filter: 'payment_status=eq.success'
          },
          (payload) => {
            if (isCleaningUp) return;
            
            const newDonation = payload.new as Donation;
            console.log('New donation received in OBS overlay:', newDonation);
            setIsConnected(true);
            currentReconnectAttempts = 0;
            setReconnectAttempts(0);
            
            // Check if donation should be shown (auto-approved or manually approved)
            const isAutoApproved = newDonation.custom_sound_url || newDonation.include_sound || newDonation.hyperemotes_enabled;
            const isManuallyApproved = newDonation.review_status === 'approved';
            
            if (!isAutoApproved && !isManuallyApproved) {
              console.log('Donation not approved for OBS display yet');
              return;
            }
            
            // Auto-approved donations show instantly, others show with 1 minute delay  
            const delay = isAutoApproved ? 0 : 60000;
            console.log(`Showing donation alert in ${delay}ms`);
            
            setTimeout(() => {
              if (isCleaningUp) return;
              
              // Update goal progress for successful payments only
              if (showGoal && newDonation.payment_status === 'success') {
                setGoalProgress(prev => prev + Number(newDonation.amount));
              }
              
              // Show donation alert if messages are enabled
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
            }, delay); // Use the calculated delay
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chiaa_gaming_donations',
            filter: 'review_status=eq.approved'
          },
          (payload) => {
            if (isCleaningUp) return;
            
            const updatedDonation = payload.new as Donation;
            console.log('Donation approved for OBS display:', updatedDonation);
            
            // Add approved donation to queue instead of showing immediately
            addToQueue(updatedDonation);
          }
        )
        .subscribe((status) => {
          if (isCleaningUp) return;
          
          console.log('Subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            currentReconnectAttempts = 0;
            setReconnectAttempts(0);
            console.log('Successfully connected to real-time updates');
            
            // Set up heartbeat to keep connection alive
            heartbeatInterval = setInterval(() => {
              if (channel && !isCleaningUp) {
                try {
                  channel.send({
                    type: 'heartbeat'
                  });
                } catch (error) {
                  console.log('Heartbeat failed, connection may be lost');
                }
              }
            }, 30000); // Send heartbeat every 30 seconds
            
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            setIsConnected(false);
            console.log('Connection lost, attempting to reconnect...');
            
            // Clear heartbeat on disconnect
            if (heartbeatInterval) {
              clearInterval(heartbeatInterval);
              heartbeatInterval = null;
            }
            
            if (currentReconnectAttempts < maxReconnectAttempts && !isCleaningUp) {
              const delay = Math.min(5000 * Math.pow(2, currentReconnectAttempts), 30000); // Start with 5s, max 30s
              currentReconnectAttempts++;
              setReconnectAttempts(currentReconnectAttempts);
              
              console.log(`Reconnecting in ${delay}ms (attempt ${currentReconnectAttempts}/${maxReconnectAttempts})`);
              
              reconnectTimeout = setTimeout(() => {
                if (!isCleaningUp) {
                  setupSubscription();
                }
              }, delay);
            } else {
              console.error('Max reconnection attempts reached. Please refresh the page.');
              setIsConnected(false);
            }
          }
        });
    };

    // Initial setup with delay to avoid immediate connection issues
    const initialTimeout = setTimeout(() => {
      if (!isCleaningUp) {
        setupSubscription();
      }
    }, 1000);

    // Cleanup function
    return () => {
      isCleaningUp = true;
      if (initialTimeout) {
        clearTimeout(initialTimeout);
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      if (channel) {
        supabase.removeChannel(channel);
      }
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
          
          @keyframes fireworksExplode {
            0% {
              transform: translate(-50%, -50%) scale(0.3);
              opacity: 0;
            }
            10% {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
            100% {
              left: var(--end-x);
              top: var(--end-y);
              transform: translate(-50%, -50%) scale(0.2);
              opacity: 0;
            }
          }
          
          @keyframes spiralUp {
            0% {
              transform: translate(-50%, -50%) rotate(0deg) translateX(0px) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -50%) rotate(720deg) translateX(100px) rotate(-720deg);
              top: -10%;
              opacity: 0;
            }
          }
          
          @keyframes bounceUp {
            0% {
              transform: translateX(0) translateY(0);
              opacity: 0;
            }
            5% {
              opacity: 1;
            }
            25% {
              transform: translateX(50px) translateY(-150px);
            }
            50% {
              transform: translateX(-30px) translateY(-300px);
            }
            75% {
              transform: translateX(40px) translateY(-450px);
            }
            100% {
              transform: translateX(0) translateY(-600px);
              opacity: 0;
            }
          }
          
          @keyframes burstOut {
            0% {
              transform: scale(0) rotate(0deg);
              opacity: 0;
            }
            20% {
              opacity: 1;
              transform: scale(1.5) rotate(180deg);
            }
            100% {
              transform: scale(0.3) rotate(360deg);
              opacity: 0;
            }
          }
          
          .donation-alert-card {
            background: rgba(0, 0, 0, 0.8);
            border-radius: 16px;
            padding: 20px;
            max-width: 400px;
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
        <div style={{ position: 'absolute', top: '32px', left: '32px', width: '480px', zIndex: 20 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.9), rgba(236, 72, 153, 0.9))',
            borderRadius: '16px',
            padding: '16px',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ color: 'white' }}>
               <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>{goalName}</h3>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', marginBottom: '8px' }}>
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
        <div style={{ position: 'absolute', top: '32px', right: '32px', zIndex: 20 }}>
          <div 
            className={`donation-alert-card transition-all duration-700 ease-out ${getAnimationClasses()}`}
          >
            <div className="donation-alert-content">
               {/* Header */}
               <div style={{ textAlign: 'center', marginBottom: currentDonation.gif_url ? '8px' : '12px' }}>
                 <h3 style={{ 
                   fontSize: currentDonation.gif_url ? '16px' : '20px', 
                   fontWeight: 'bold', 
                   margin: 0 
                 }}>New Donation! 🎉</h3>
               </div>
               
               {/* Donation details */}
               <div style={{ textAlign: 'center', marginBottom: currentDonation.gif_url ? '8px' : '12px' }}>
                 <div style={{ 
                   fontSize: currentDonation.gif_url ? '18px' : '24px', 
                   fontWeight: 'bold', 
                   color: '#00bcd4' 
                 }}>
                   ₹{Number(currentDonation.amount).toLocaleString()}
                 </div>
                 <div style={{ fontSize: currentDonation.gif_url ? '12px' : '16px' }}>
                   from {currentDonation.name}
                 </div>
               </div>
              
              {currentDonation.message && (
                <div style={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                  borderRadius: '6px', 
                  padding: currentDonation.gif_url ? '4px' : '6px', 
                  marginBottom: currentDonation.gif_url ? '6px' : '8px' 
                }}>
                  <p style={{ 
                    fontSize: currentDonation.gif_url ? '11px' : '14px', 
                    fontStyle: 'italic', 
                    textAlign: 'center', 
                    margin: 0 
                  }}>
                    "{currentDonation.message}"
                  </p>
                </div>
              )}

              {/* GIF display with gradient border - Much bigger for GIF donations */}
              {currentDonation.gif_url && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                  <div className="gif-glow-outline">
                    <img 
                      src={currentDonation.gif_url} 
                      alt="Donation GIF" 
                      style={{ 
                        width: '180px', 
                        height: '180px', 
                        objectFit: 'cover', 
                        borderRadius: '8px',
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
