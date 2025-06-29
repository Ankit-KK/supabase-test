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
  startY: number;
  endX: number;
  endY: number;
  rotation: number;
  scale: number;
  duration: number;
  delay: number;
  animationType: 'bounce' | 'spin' | 'drift' | 'zigzag' | 'spiral';
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

  // Create completely random floating emojis
  const createFloatingEmojis = (emoji: string, count: number = 20) => {
    const newEmojis: FloatingEmoji[] = [];
    const animationTypes: ('bounce' | 'spin' | 'drift' | 'zigzag' | 'spiral')[] = 
      ['bounce', 'spin', 'drift', 'zigzag', 'spiral'];
    
    for (let i = 0; i < count; i++) {
      // Completely random corner selection
      const corner = Math.floor(Math.random() * 4);
      let startX, startY, endX, endY;
      
      // Random positions with more variation
      switch (corner) {
        case 0: // Bottom-left area
          startX = -10 + Math.random() * 15; // -10% to 5%
          startY = 95 + Math.random() * 15; // 95% to 110%
          endX = Math.random() * 40; // 0% to 40%
          endY = -20 + Math.random() * 25; // -20% to 5%
          break;
        case 1: // Bottom-right area
          startX = 95 + Math.random() * 15; // 95% to 110%
          startY = 95 + Math.random() * 15; // 95% to 110%
          endX = 60 + Math.random() * 40; // 60% to 100%
          endY = -20 + Math.random() * 25; // -20% to 5%
          break;
        case 2: // Top-left area
          startX = -10 + Math.random() * 15; // -10% to 5%
          startY = -10 + Math.random() * 15; // -10% to 5%
          endX = Math.random() * 40; // 0% to 40%
          endY = 95 + Math.random() * 25; // 95% to 120%
          break;
        case 3: // Top-right area
        default:
          startX = 95 + Math.random() * 15; // 95% to 110%
          startY = -10 + Math.random() * 15; // -10% to 5%
          endX = 60 + Math.random() * 40; // 60% to 100%
          endY = 95 + Math.random() * 25; // 95% to 120%
          break;
      }

      newEmojis.push({
        id: `emoji-${Date.now()}-${i}-${Math.random()}`,
        emoji,
        startX,
        startY,
        endX,
        endY,
        rotation: Math.random() * 1440, // 0 to 4 full rotations
        scale: 0.5 + Math.random() * 2, // 0.5x to 2.5x scale
        duration: 3 + Math.random() * 5, // 3-8 seconds
        delay: Math.random() * 2, // 0-2 seconds delay
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

  useEffect(() => {
    if (showGoal) {
      fetchGoalProgress();
    }
  }, [showGoal]);

  useEffect(() => {
    // Set up real-time subscription for ALL donations (both successful and failed)
    const channel = supabase
      .channel(`ankit-obs-overlay-${obsId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ankit_donations'
        },
        (payload) => {
          const newDonation = payload.new as Donation;
          console.log('New donation received in OBS overlay (all statuses):', {
            id: newDonation.id,
            name: newDonation.name,
            amount: newDonation.amount,
            payment_status: newDonation.payment_status,
            selected_emoji: newDonation.selected_emoji
          });
          
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
            console.log(`Showing donation alert for ${newDonation.payment_status} payment`);
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

    console.log('Ankit OBS overlay real-time subscription set up - ALL PAYMENT STATUSES');

    return () => {
      supabase.removeChannel(channel);
    };
  }, [obsId, showMessages, showGoal]);

  // Get random animation keyframes based on type
  const getRandomAnimationKeyframes = (emoji: FloatingEmoji) => {
    const baseTransform = `translate(-50%, -50%)`;
    
    switch (emoji.animationType) {
      case 'zigzag':
        return `
          0% { 
            left: ${emoji.startX}%; 
            top: ${emoji.startY}%; 
            transform: ${baseTransform} scale(0.3) rotate(0deg);
            opacity: 0;
          }
          10% { 
            opacity: 1;
            transform: ${baseTransform} scale(${emoji.scale}) rotate(45deg);
          }
          25% { 
            left: ${emoji.startX + (emoji.endX - emoji.startX) * 0.3}%; 
            top: ${emoji.startY + (emoji.endY - emoji.startY) * 0.2}%; 
            transform: ${baseTransform} scale(${emoji.scale * 1.2}) rotate(90deg);
          }
          50% { 
            left: ${emoji.endX * 0.7}%; 
            top: ${emoji.startY + (emoji.endY - emoji.startY) * 0.6}%; 
            transform: ${baseTransform} scale(${emoji.scale}) rotate(180deg);
          }
          75% { 
            left: ${emoji.endX * 0.9}%; 
            top: ${emoji.startY + (emoji.endY - emoji.startY) * 0.8}%; 
            transform: ${baseTransform} scale(${emoji.scale * 0.8}) rotate(270deg);
          }
          100% { 
            left: ${emoji.endX}%; 
            top: ${emoji.endY}%; 
            transform: ${baseTransform} scale(0.2) rotate(${emoji.rotation}deg);
            opacity: 0;
          }
        `;
      case 'spiral':
        return `
          0% { 
            left: ${emoji.startX}%; 
            top: ${emoji.startY}%; 
            transform: ${baseTransform} scale(0.3) rotate(0deg);
            opacity: 0;
          }
          10% { 
            opacity: 1;
            transform: ${baseTransform} scale(${emoji.scale}) rotate(180deg);
          }
          25% { 
            left: ${emoji.startX + Math.sin(Math.PI * 0.5) * 20}%; 
            top: ${emoji.startY + (emoji.endY - emoji.startY) * 0.25}%; 
            transform: ${baseTransform} scale(${emoji.scale}) rotate(360deg);
          }
          50% { 
            left: ${emoji.startX + Math.sin(Math.PI) * 15}%; 
            top: ${emoji.startY + (emoji.endY - emoji.startY) * 0.5}%; 
            transform: ${baseTransform} scale(${emoji.scale * 1.3}) rotate(540deg);
          }
          75% { 
            left: ${emoji.startX + Math.sin(Math.PI * 1.5) * 10}%; 
            top: ${emoji.startY + (emoji.endY - emoji.startY) * 0.75}%; 
            transform: ${baseTransform} scale(${emoji.scale}) rotate(720deg);
          }
          100% { 
            left: ${emoji.endX}%; 
            top: ${emoji.endY}%; 
            transform: ${baseTransform} scale(0.2) rotate(${emoji.rotation}deg);
            opacity: 0;
          }
        `;
      default:
        return `
          0% { 
            left: ${emoji.startX}%; 
            top: ${emoji.startY}%; 
            transform: ${baseTransform} scale(0.3) rotate(0deg);
            opacity: 0;
          }
          10% { 
            opacity: 1;
            transform: ${baseTransform} scale(${emoji.scale}) rotate(${emoji.rotation * 0.2}deg);
          }
          50% { 
            transform: ${baseTransform} scale(${emoji.scale * 1.1}) rotate(${emoji.rotation * 0.6}deg);
          }
          90% { 
            opacity: 0.8;
            transform: ${baseTransform} scale(${emoji.scale * 0.7}) rotate(${emoji.rotation * 0.9}deg);
          }
          100% { 
            left: ${emoji.endX}%; 
            top: ${emoji.endY}%; 
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

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ background: 'transparent' }}
    >
      {/* Dynamic Styles for Random Animations */}
      <style>
        {floatingEmojis.map((emoji) => `
          @keyframes randomMove-${emoji.id} {
            ${getRandomAnimationKeyframes(emoji)}
          }
          .emoji-${emoji.id} {
            animation: randomMove-${emoji.id} ${emoji.duration}s ease-out forwards;
            animation-delay: ${emoji.delay}s;
          }
        `).join('\n')}
      </style>

      {/* Floating Emojis Layer - Completely Random */}
      <div className="absolute inset-0 z-10">
        {floatingEmojis.map((floatingEmoji) => (
          <div
            key={floatingEmoji.id}
            className={`absolute pointer-events-none select-none emoji-${floatingEmoji.id}`}
            style={{
              left: `${floatingEmoji.startX}%`,
              top: `${floatingEmoji.startY}%`,
              transform: `translate(-50%, -50%)`,
              fontSize: `${2 + Math.random() * 2}rem`, // Random size 2-4rem
              zIndex: 50,
              filter: `hue-rotate(${Math.random() * 360}deg) brightness(${0.8 + Math.random() * 0.4})`,
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
