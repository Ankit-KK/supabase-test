import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  created_at: string;
  payment_status: string;
  selected_emoji?: string;
}

interface FloatingEmoji {
  id: string;
  emoji: string;
  startX: number;
  endX: number;
  rotation: number;
  scale: number;
  duration: number;
  delay: number;
  animationType: 'straight' | 'curve' | 'zigzag' | 'spiral' | 'wave';
}

const AnkitObsOverlay = () => {
  const { obsId } = useParams();
  const [searchParams] = useSearchParams();
  const showMessages = searchParams.get('showMessages') !== 'false';
  const showGoal = searchParams.get('showGoal') === 'true';
  const goalName = searchParams.get('goalName') || 'Support Goal';
  const goalTarget = Number(searchParams.get('goalTarget')) || 500;
  
  const [currentDonation, setCurrentDonation] = useState<Donation | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'show' | 'exit'>('enter');
  const [goalProgress, setGoalProgress] = useState<number>(0);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  // Calculate goal progress from today's successful donations only
  const fetchGoalProgress = async () => {
    try {
      const today = new Date();
      const todayStart = `${today.toISOString().split('T')[0]}T00:00:00`;
      const todayEnd = `${today.toISOString().split('T')[0]}T23:59:59`;
      
      const { data, error } = await supabase
        .from("ankit_donations")
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

  // Create emojis that travel from bottom to top with random paths
  const createFloatingEmojis = (emoji: string, count: number = 20) => {
    const newEmojis: FloatingEmoji[] = [];
    const animationTypes: ('straight' | 'curve' | 'zigzag' | 'spiral' | 'wave')[] = 
      ['straight', 'curve', 'zigzag', 'spiral', 'wave'];
    
    for (let i = 0; i < count; i++) {
      // Random horizontal start position (anywhere across bottom)
      const startX = Math.random() * 100; // 0% to 100% across screen width
      
      // Random horizontal end position (anywhere across top)
      const endX = Math.random() * 100; // 0% to 100% across screen width
      
      newEmojis.push({
        id: `emoji-${Date.now()}-${i}-${Math.random()}`,
        emoji,
        startX,
        endX,
        rotation: Math.random() * 720, // 0 to 2 full rotations
        scale: 0.8 + Math.random() * 1.5, // 0.8x to 2.3x scale
        duration: 3 + Math.random() * 4, // 3-7 seconds
        delay: Math.random() * 3, // 0-3 seconds delay
        animationType: animationTypes[Math.floor(Math.random() * animationTypes.length)],
      });
    }
    
    setFloatingEmojis(prev => [...prev, ...newEmojis]);
    
    // Clean up emojis after max duration + delay
    setTimeout(() => {
      setFloatingEmojis(prev => 
        prev.filter(e => !newEmojis.some(ne => ne.id === e.id))
      );
    }, 10000);
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
          p_admin_type: 'ankit'
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

  useEffect(() => {
    if (showGoal && tokenValid) {
      fetchGoalProgress();
    }
  }, [showGoal, tokenValid]);

  useEffect(() => {
    if (!tokenValid) return;

    let channel: any = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    const maxReconnectAttempts = 5;

    const setupSubscription = () => {
      console.log(`Setting up real-time subscription (attempt ${reconnectAttempts + 1})`);
      
      // Clean up existing channel
      if (channel) {
        supabase.removeChannel(channel);
      }

      // Set up real-time subscription for ALL donations with 1 minute delay for OBS
      channel = supabase
        .channel(`ankit-obs-overlay-${obsId}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'ankit_donations'
          },
          (payload) => {
            const newDonation = payload.new as Donation;
            console.log('New donation received in OBS overlay with 1 minute delay (all statuses):', {
              id: newDonation.id,
              name: newDonation.name,
              amount: newDonation.amount,
              payment_status: newDonation.payment_status,
              selected_emoji: newDonation.selected_emoji
            });
            setIsConnected(true);
            setReconnectAttempts(0);
            
            // Add 1 minute delay before showing OBS alert
            setTimeout(() => {
              // Update goal progress only for successful payments
              if (showGoal && newDonation.payment_status === "success") {
                setGoalProgress(prev => prev + Number(newDonation.amount));
                console.log("Updated goal progress for successful donation");
              }
              
              // Create floating emojis celebration with random count
              if (newDonation.selected_emoji) {
                const baseCount = 20;
                const randomVariation = Math.floor(Math.random() * 10) - 5; // -5 to +5
                const emojiCount = Math.max(15, baseCount + randomVariation);
                createFloatingEmojis(newDonation.selected_emoji, emojiCount);
              }
              
              // Show donation alert for ALL donations (success and failed) if messages are enabled
              if (showMessages) {
                console.log(`Showing donation alert for ${newDonation.payment_status} payment after 1 minute delay`);
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
            }, 60000); // 1 minute delay (60000ms)
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            setReconnectAttempts(0);
            console.log('Successfully connected to real-time updates');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            setIsConnected(false);
            console.log('Connection lost, attempting to reconnect...');
            
            if (reconnectAttempts < maxReconnectAttempts) {
              const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff, max 30s
              reconnectTimeout = setTimeout(() => {
                setReconnectAttempts(prev => prev + 1);
                setupSubscription();
              }, delay);
            } else {
              console.error('Max reconnection attempts reached');
            }
          }
        });
    };

    // Initial setup
    setupSubscription();

    // Cleanup function
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [obsId, showMessages, showGoal, tokenValid, reconnectAttempts]);

  // Get travel animation keyframes - bottom to top movement
  const getTravelAnimationKeyframes = (emoji: FloatingEmoji) => {
    const baseTransform = `translate(-50%, -50%)`;
    
    switch (emoji.animationType) {
      case 'curve':
        const midX = (emoji.startX + emoji.endX) / 2 + (Math.random() - 0.5) * 40; // Curve deviation
        return `
          0% { 
            left: ${emoji.startX}%; 
            top: 110%; 
            transform: ${baseTransform} scale(0.3) rotate(0deg);
            opacity: 0;
          }
          5% { 
            opacity: 1;
            transform: ${baseTransform} scale(${emoji.scale}) rotate(${emoji.rotation * 0.1}deg);
          }
          50% { 
            left: ${midX}%; 
            top: 50%; 
            transform: ${baseTransform} scale(${emoji.scale * 1.1}) rotate(${emoji.rotation * 0.5}deg);
          }
          95% { 
            opacity: 1;
            transform: ${baseTransform} scale(${emoji.scale * 0.8}) rotate(${emoji.rotation * 0.9}deg);
          }
          100% { 
            left: ${emoji.endX}%; 
            top: -10%; 
            transform: ${baseTransform} scale(0.2) rotate(${emoji.rotation}deg);
            opacity: 0;
          }
        `;
      case 'zigzag':
        return `
          0% { 
            left: ${emoji.startX}%; 
            top: 110%; 
            transform: ${baseTransform} scale(0.3) rotate(0deg);
            opacity: 0;
          }
          5% { 
            opacity: 1;
            transform: ${baseTransform} scale(${emoji.scale}) rotate(45deg);
          }
          25% { 
            left: ${emoji.startX + (Math.random() - 0.5) * 20}%; 
            top: 75%; 
            transform: ${baseTransform} scale(${emoji.scale * 1.2}) rotate(90deg);
          }
          50% { 
            left: ${emoji.endX + (Math.random() - 0.5) * 20}%; 
            top: 50%; 
            transform: ${baseTransform} scale(${emoji.scale}) rotate(180deg);
          }
          75% { 
            left: ${emoji.startX + (Math.random() - 0.5) * 15}%; 
            top: 25%; 
            transform: ${baseTransform} scale(${emoji.scale * 0.9}) rotate(270deg);
          }
          95% { 
            opacity: 1;
            transform: ${baseTransform} scale(${emoji.scale * 0.7}) rotate(315deg);
          }
          100% { 
            left: ${emoji.endX}%; 
            top: -10%; 
            transform: ${baseTransform} scale(0.2) rotate(${emoji.rotation}deg);
            opacity: 0;
          }
        `;
      case 'spiral':
        return `
          0% { 
            left: ${emoji.startX}%; 
            top: 110%; 
            transform: ${baseTransform} scale(0.3) rotate(0deg);
            opacity: 0;
          }
          5% { 
            opacity: 1;
            transform: ${baseTransform} scale(${emoji.scale}) rotate(180deg);
          }
          25% { 
            left: ${emoji.startX + Math.sin(Math.PI * 0.5) * 15}%; 
            top: 75%; 
            transform: ${baseTransform} scale(${emoji.scale}) rotate(360deg);
          }
          50% { 
            left: ${emoji.endX + Math.sin(Math.PI) * 10}%; 
            top: 50%; 
            transform: ${baseTransform} scale(${emoji.scale * 1.3}) rotate(540deg);
          }
          75% { 
            left: ${emoji.endX + Math.sin(Math.PI * 1.5) * 5}%; 
            top: 25%; 
            transform: ${baseTransform} scale(${emoji.scale}) rotate(720deg);
          }
          95% { 
            opacity: 1;
            transform: ${baseTransform} scale(${emoji.scale * 0.8}) rotate(900deg);
          }
          100% { 
            left: ${emoji.endX}%; 
            top: -10%; 
            transform: ${baseTransform} scale(0.2) rotate(${emoji.rotation}deg);
            opacity: 0;
          }
        `;
      case 'wave':
        return `
          0% { 
            left: ${emoji.startX}%; 
            top: 110%; 
            transform: ${baseTransform} scale(0.3) rotate(0deg);
            opacity: 0;
          }
          5% { 
            opacity: 1;
            transform: ${baseTransform} scale(${emoji.scale}) rotate(${emoji.rotation * 0.2}deg);
          }
          20% { 
            left: ${emoji.startX + Math.sin(0.4 * Math.PI) * 12}%; 
            top: 80%; 
          }
          40% { 
            left: ${emoji.startX + Math.sin(0.8 * Math.PI) * 15}%; 
            top: 60%; 
          }
          60% { 
            left: ${emoji.endX + Math.sin(1.2 * Math.PI) * 12}%; 
            top: 40%; 
          }
          80% { 
            left: ${emoji.endX + Math.sin(1.6 * Math.PI) * 8}%; 
            top: 20%; 
          }
          95% { 
            opacity: 1;
            transform: ${baseTransform} scale(${emoji.scale * 0.7}) rotate(${emoji.rotation * 0.9}deg);
          }
          100% { 
            left: ${emoji.endX}%; 
            top: -10%; 
            transform: ${baseTransform} scale(0.2) rotate(${emoji.rotation}deg);
            opacity: 0;
          }
        `;
      default: // straight
        return `
          0% { 
            left: ${emoji.startX}%; 
            top: 110%; 
            transform: ${baseTransform} scale(0.3) rotate(0deg);
            opacity: 0;
          }
          5% { 
            opacity: 1;
            transform: ${baseTransform} scale(${emoji.scale}) rotate(${emoji.rotation * 0.2}deg);
          }
          50% { 
            transform: ${baseTransform} scale(${emoji.scale * 1.1}) rotate(${emoji.rotation * 0.6}deg);
          }
          95% { 
            opacity: 1;
            transform: ${baseTransform} scale(${emoji.scale * 0.8}) rotate(${emoji.rotation * 0.9}deg);
          }
          100% { 
            left: ${emoji.endX}%; 
            top: -10%; 
            transform: ${baseTransform} scale(0.2) rotate(${emoji.rotation}deg);
            opacity: 0;
          }
        `;
    }
  };

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

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'from-green-500 via-emerald-500 to-teal-500';
      case 'failed':
        return 'from-red-500 via-rose-500 to-pink-500';
      case 'pending':
        return 'from-yellow-500 via-amber-500 to-orange-500';
      default:
        return 'from-purple-600 via-pink-600 to-orange-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return 'New Donation!';
      case 'failed':
        return 'Payment Failed!';
      case 'pending':
        return 'Payment Pending!';
      default:
        return 'New Donation!';
    }
  };

  const goalPercentage = Math.min((goalProgress / goalTarget) * 100, 100);

  // Show loading or error state for token validation
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

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ background: 'transparent' }}
    >
      {/* Dynamic Styles for Travel Animations */}
      <style>
        {floatingEmojis.map((emoji) => `
          @keyframes travelUp-${emoji.id} {
            ${getTravelAnimationKeyframes(emoji)}
          }
          .emoji-${emoji.id} {
            animation: travelUp-${emoji.id} ${emoji.duration}s ease-out forwards;
            animation-delay: ${emoji.delay}s;
          }
        `).join('\n')}
      </style>

      {/* Floating Emojis Layer - Travel from bottom to top */}
      <div className="absolute inset-0 z-10">
        {floatingEmojis.map((floatingEmoji) => (
          <div
            key={floatingEmoji.id}
            className={`absolute pointer-events-none select-none emoji-${floatingEmoji.id}`}
            style={{
              left: `${floatingEmoji.startX}%`,
              top: '110%', // Start below screen
              transform: `translate(-50%, -50%)`,
              fontSize: `${1.5 + Math.random() * 2}rem`, // Random size 1.5-3.5rem
              zIndex: 50,
              filter: `hue-rotate(${Math.random() * 360}deg) brightness(${0.9 + Math.random() * 0.2})`,
            }}
          >
            {floatingEmoji.emoji}
          </div>
        ))}
      </div>

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

      {/* Donation Alert - Now shows for all payment statuses */}
      {currentDonation && showMessages && (
        <div className="absolute top-4 right-4 w-96 max-w-md z-20">
          <div 
            className={`
              relative overflow-hidden rounded-2xl shadow-2xl
              transition-all duration-700 ease-out
              ${getAnimationClasses()}
            `}
          >
            {/* Dynamic background gradient based on payment status */}
            <div className={`absolute inset-0 bg-gradient-to-br ${getBorderColor(currentDonation.payment_status)} animate-gradient-x`}></div>
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            
            {/* Content */}
            <div className="relative p-6 text-white">
              {/* Header with bouncing emoji and celebration */}
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-2xl font-bold transition-all duration-500 ${animationPhase === 'show' ? 'animate-pulse-glow' : ''}`}>
                  {getStatusText(currentDonation.payment_status)}
                </h3>
                <div className="flex items-center space-x-2">
                  {currentDonation.selected_emoji && (
                    <div className={`text-5xl transition-all duration-700 ${animationPhase === 'show' ? 'animate-bounce' : ''}`}>
                      {currentDonation.selected_emoji}
                    </div>
                  )}
                  <div className={`text-4xl transition-all duration-700 ${animationPhase === 'show' ? 'animate-bounce' : ''}`} style={{ animationDelay: '0.2s' }}>
                    {currentDonation.payment_status === 'success' ? '🎉' : currentDonation.payment_status === 'failed' ? '😔' : '⏳'}
                  </div>
                </div>
              </div>
              
              {/* Donation details with staggered animations */}
              <div className="space-y-3">
                <div className={`flex justify-between items-center transition-all duration-500 delay-200 ${animationPhase === 'enter' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                  <span className="text-lg font-semibold">{currentDonation.name}</span>
                  <span className={`text-3xl font-bold transition-all duration-300 ${
                    currentDonation.payment_status === 'success' ? 'text-yellow-300' : 'text-gray-300'
                  } ${animationPhase === 'show' ? 'animate-pulse scale-110' : ''}`}>
                    ₹{Number(currentDonation.amount).toLocaleString()}
                  </span>
                </div>
                
                {currentDonation.message && (
                  <div className={`bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-white/20 transition-all duration-500 delay-400 ${animationPhase === 'enter' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                    <p className="text-sm italic">"{currentDonation.message}"</p>
                  </div>
                )}
              </div>
              
              {/* Status-specific thank you message */}
              <div className={`mt-4 text-center transition-all duration-500 delay-600 ${animationPhase === 'enter' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                <div className={`inline-block bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm border border-white/30 ${animationPhase === 'show' ? 'animate-float' : ''}`}>
                  {currentDonation.payment_status === 'success' 
                    ? 'Thank you for your support! ❤️'
                    : currentDonation.payment_status === 'failed'
                      ? 'Thanks for trying! Please retry if needed 💙'
                      : 'Processing your payment... ⏳'
                  }
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-ping"></div>
            <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-pink-400 rounded-full animate-pulse"></div>
            
            {/* Progress bar animation */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div 
                className={`h-full transition-all duration-[12000ms] ease-linear ${
                  currentDonation.payment_status === 'success' 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                    : 'bg-gradient-to-r from-gray-400 to-gray-600'
                }`}
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

export default AnkitObsOverlay;
