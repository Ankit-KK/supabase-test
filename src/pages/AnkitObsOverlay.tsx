
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useObsConfig } from "@/contexts/ObsConfigContext";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  created_at: string;
  payment_status: string;
}

const AnkitObsOverlay = () => {
  const { obsId } = useParams();
  const [searchParams] = useSearchParams();
  const showMessages = searchParams.get('showMessages') !== 'false';
  const [currentDonation, setCurrentDonation] = useState<Donation | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'show' | 'exit'>('enter');
  const { obsConfig } = useObsConfig();

  useEffect(() => {
    // Set up real-time subscription for new donations
    const channel = supabase
      .channel(`ankit-obs-overlay-${obsId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ankit_donations',
          filter: 'payment_status=eq.success'
        },
        (payload) => {
          const newDonation = payload.new as Donation;
          console.log('New donation received in OBS overlay:', newDonation);
          
          // Reset animation state and show the donation alert
          setAnimationPhase('enter');
          setCurrentDonation(newDonation);
          setIsVisible(true);
          
          // Transition through animation phases
          setTimeout(() => setAnimationPhase('show'), 500);
          
          // Start exit animation after 12 seconds
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
      )
      .subscribe();

    console.log('OBS overlay real-time subscription set up');

    return () => {
      supabase.removeChannel(channel);
    };
  }, [obsId]);

  if (!currentDonation) {
    return (
      <div className="w-full h-full bg-transparent">
        {/* Empty state - transparent background for OBS */}
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

  return (
    <div 
      className={`fixed inset-0 pointer-events-none ${obsConfig.isDraggable ? 'pointer-events-auto' : ''}`}
      style={{ background: 'transparent' }}
    >
      <div 
        className={`
          ${obsConfig.isDraggable ? 'resize border-2 border-dashed border-blue-500' : ''}
          absolute top-4 right-4 w-96 max-w-md
        `}
        style={{
          resize: obsConfig.isDraggable ? 'both' : 'none',
          overflow: obsConfig.isDraggable ? 'auto' : 'visible'
        }}
      >
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
            {/* Header with bouncing emoji */}
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-2xl font-bold transition-all duration-500 ${animationPhase === 'show' ? 'animate-pulse-glow' : ''}`}>
                New Donation!
              </h3>
              <div className={`text-4xl transition-all duration-700 ${animationPhase === 'show' ? 'animate-bounce' : ''}`}>
                🎉
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
              
              {showMessages && currentDonation.message && (
                <div className={`bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-white/20 transition-all duration-500 delay-400 ${animationPhase === 'enter' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                  <p className="text-sm italic">"{currentDonation.message}"</p>
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
      
      {obsConfig.isDraggable && (
        <div className="absolute top-2 left-2 bg-blue-500 text-white px-3 py-1 rounded text-sm">
          Edit Mode: Drag & Resize
        </div>
      )}
    </div>
  );
};

export default AnkitObsOverlay;
