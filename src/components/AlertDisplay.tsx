import React, { useState, useEffect, useRef } from 'react';
import { Gift, Heart, Star, Zap, Music } from 'lucide-react';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  voice_message_url?: string;
  created_at: string;
  is_hyperemote: boolean;
}

interface AlertDisplayProps {
  donation: Donation | null;
  isVisible: boolean;
  streamerBrandColor?: string;
  streamerName?: string;
}

const HYPEREMOTE_ICONS = {
  50: Gift,
  100: Heart,
  200: Star,
  500: Zap,
  1000: Music
};

export const AlertDisplay: React.FC<AlertDisplayProps> = ({
  donation,
  isVisible,
  streamerBrandColor = '#3b82f6',
  streamerName = 'Streamer'
}) => {
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const donationIdRef = useRef<string | null>(null);

  // Typing effect for messages
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Reset state immediately
    setDisplayedMessage('');
    setIsTyping(false);

    if (!donation?.message || !isVisible) {
      return;
    }

    // Check if this is a new donation
    if (donationIdRef.current !== donation.id) {
      donationIdRef.current = donation.id;
    }

    if (donation.voice_message_url) {
      // For voice messages, show full text immediately
      setDisplayedMessage(donation.message);
      return;
    }

    // Start typing effect for text messages
    setIsTyping(true);
    let index = 0;
    const message = donation.message;
    
    intervalRef.current = setInterval(() => {
      // Double check we're still on the same donation
      if (donationIdRef.current !== donation.id) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      if (index < message.length) {
        setDisplayedMessage(message.substring(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, 50);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [donation?.id, donation?.message, donation?.voice_message_url, isVisible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Get appropriate hyperemote icon
  const getHyperemoteIcon = (amount: number) => {
    const thresholds = Object.keys(HYPEREMOTE_ICONS)
      .map(Number)
      .sort((a, b) => b - a);
    
    for (const threshold of thresholds) {
      if (amount >= threshold) {
        return HYPEREMOTE_ICONS[threshold as keyof typeof HYPEREMOTE_ICONS];
      }
    }
    return Gift;
  };

  if (!donation || !isVisible) {
    return null;
  }

  const IconComponent = donation.is_hyperemote ? getHyperemoteIcon(donation.amount) : null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <style>{`
        @keyframes alertFadeIn {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes rotBGimg {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes hyperemoteFloat {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-10px) rotate(5deg);
          }
          75% {
            transform: translateY(5px) rotate(-3deg);
          }
        }
        
        @keyframes hyperemotePulse {
          0%, 100% {
            box-shadow: 0 0 20px ${streamerBrandColor}40;
          }
          50% {
            box-shadow: 0 0 40px ${streamerBrandColor}80, 0 0 60px ${streamerBrandColor}40;
          }
        }
        
        @keyframes blink {
          0%, 100% { border-color: transparent }
          50% { border-color: white }
        }
        
        .alert-enter {
          animation: alertFadeIn 0.5s ease-out;
        }
        
        .hyperemote-float {
          animation: hyperemoteFloat 3s ease-in-out infinite;
        }
        
        .hyperemote-glow {
          animation: hyperemotePulse 2s ease-in-out infinite;
        }

        .alert-card {
          position: relative;
          overflow: hidden;
          border-radius: 20px;
        }

        .alert-card::before {
          content: '';
          position: absolute;
          width: 200%;
          background-image: linear-gradient(180deg, rgb(0, 183, 255), rgb(255, 48, 255));
          height: 200%;
          animation: rotBGimg 3s linear infinite;
          transition: all 0.2s linear;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        }

        .alert-card::after {
          content: '';
          position: absolute;
          background: #07182E;
          inset: 5px;
          border-radius: 15px;
        }

        .alert-card.hyperemote::before {
          background-image: linear-gradient(180deg, ${streamerBrandColor}, rgb(255, 48, 255));
        }
      `}</style>

      <div className={`
        fixed bottom-8 left-1/2 transform -translate-x-1/2 p-4 z-50
        ${isVisible ? 'opacity-100' : 'opacity-0'}
        transition-opacity duration-500
      `}>
        <div 
          className={`
            alert-card alert-enter min-w-[200px] max-w-[400px] min-h-[150px] relative flex flex-col justify-center items-center p-4
            ${donation.is_hyperemote ? 'hyperemote-float hyperemote' : ''} 
          `}
        >
          {/* Hyperemote Celebration Effects */}
          {donation.is_hyperemote && (
            <div className="absolute -top-4 -right-4 z-10">
              {IconComponent && (
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl"
                  style={{ backgroundColor: streamerBrandColor }}
                >
                  <IconComponent className="w-8 h-8" />
                </div>
              )}
            </div>
          )}

          {/* Content Container with proper z-index */}
          <div className="relative z-10 text-center text-white w-full">
            {/* Alert Header */}
            <div className="mb-3">
              <h2 className="text-lg font-bold mb-1">
                {donation.is_hyperemote ? '🎉 HYPEREMOTE! 🎉' : 'New Donation!'}
              </h2>
              <div className="flex flex-col items-center gap-1 text-sm font-semibold">
                <span>{donation.name}</span>
                <span className="text-green-400">donated ₹{donation.amount}</span>
              </div>
            </div>

            {/* Voice Message */}
            {donation.voice_message_url && (
              <div className="mb-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full text-blue-300 text-xs">
                  <Music className="w-4 h-4" />
                  <span className="font-medium">Voice Message</span>
                </div>
                <audio
                  src={donation.voice_message_url}
                  autoPlay
                  controls
                  className="mt-2 mx-auto block max-w-full h-8"
                />
              </div>
            )}

            {/* Message with Typing Effect */}
            {donation.message && (
              <div className="mb-3">
                <div className="text-sm leading-relaxed p-3 bg-white/10 rounded-lg backdrop-blur-sm min-h-[40px] flex items-center justify-center">
                  <span className="break-words text-center">
                    {donation.voice_message_url ? donation.message : displayedMessage}
                    {isTyping && <span className="animate-pulse border-r-2 border-white ml-1">|</span>}
                  </span>
                </div>
              </div>
            )}

            {/* Streamer Branding */}
            <div>
              <div className="inline-block px-3 py-1 rounded-full text-white text-xs font-medium bg-white/20 backdrop-blur-sm">
                Thank you for supporting {streamerName}!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};