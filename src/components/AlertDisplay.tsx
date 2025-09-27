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
  1: Gift,
  50: Heart,
  100: Star,
  200: Zap,
  500: Music
};

// Hyperemote emotes for rain effect
const hyperemotes = [
  { id: 'happy', src: '/lovable-uploads/2f07c754-6bf7-40e6-8a98-f181f991614a.png', name: 'Happy' },
  { id: 'peaceful', src: '/lovable-uploads/292d1bf8-f7af-4bf3-8540-9e79fda428c2.png', name: 'Peaceful' },
  { id: 'disappointed', src: '/lovable-uploads/a62460bb-2981-4570-8bce-51472286d43f.png', name: 'Disappointed' },
  { id: 'upset', src: '/lovable-uploads/2016b23f-1791-4159-b604-4ec5ecbf505e.png', name: 'Upset' },
  { id: 'wink', src: '/lovable-uploads/2e0cb8ea-caa0-4039-a256-b14849269d25.png', name: 'Wink' },
  { id: 'surprised', src: '/lovable-uploads/6c1ab8e8-8d6f-48bf-9111-059acae74a34.png', name: 'Surprised' },
  { id: 'excited', src: '/lovable-uploads/5459b5bb-a628-4c02-a9ca-4b374fe1fe38.png', name: 'Excited' },
  { id: 'love', src: '/lovable-uploads/33359350-7d33-4384-81d9-99fcf0220f60.png', name: 'Love' },
  { id: 'sleepy', src: '/lovable-uploads/cd661d15-1109-41d5-9908-70531edc117c.png', name: 'Sleepy' },
  { id: 'crying', src: '/lovable-uploads/2d18e120-71ab-48bf-8ead-36620a7546a8.png', name: 'Crying' },
];

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

  // For hyperemotes, show rain effect instead of alert box
  if (donation.is_hyperemote) {
    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        <style>{`
          @keyframes floatUp {
            0% { 
              opacity: 0; 
              transform: translateY(100vh) scale(0.5) rotate(0deg); 
            }
            20% { 
              opacity: 1; 
              transform: translateY(80vh) scale(1) rotate(180deg); 
            }
            80% { 
              opacity: 1; 
              transform: translateY(20vh) scale(1.2) rotate(340deg); 
            }
            100% { 
              opacity: 0; 
              transform: translateY(-10vh) scale(0.8) rotate(360deg); 
            }
          }
          @keyframes floatUpLeft {
            0% { 
              opacity: 0; 
              transform: translateY(100vh) translateX(0) scale(0.5) rotate(0deg); 
            }
            50% { 
              opacity: 1; 
              transform: translateY(50vh) translateX(-100px) scale(1.1) rotate(180deg); 
            }
            100% { 
              opacity: 0; 
              transform: translateY(-10vh) translateX(-200px) scale(0.7) rotate(360deg); 
            }
          }
          @keyframes floatUpRight {
            0% { 
              opacity: 0; 
              transform: translateY(100vh) translateX(0) scale(0.5) rotate(0deg); 
            }
            50% { 
              opacity: 1; 
              transform: translateY(50vh) translateX(100px) scale(1.1) rotate(-180deg); 
            }
            100% { 
              opacity: 0; 
              transform: translateY(-10vh) translateX(200px) scale(0.7) rotate(-360deg); 
            }
          }
          @keyframes spiralUp {
            0% { 
              opacity: 0; 
              transform: translateY(100vh) rotateY(0deg) scale(0.5); 
            }
            25% { 
              opacity: 1; 
              transform: translateY(75vh) rotateY(90deg) scale(1); 
            }
            50% { 
              opacity: 1; 
              transform: translateY(50vh) rotateY(180deg) scale(1.2); 
            }
            75% { 
              opacity: 1; 
              transform: translateY(25vh) rotateY(270deg) scale(1); 
            }
            100% { 
              opacity: 0; 
              transform: translateY(-10vh) rotateY(360deg) scale(0.8); 
            }
          }
        `}</style>
        
        {/* Hyperemote Rain Effect */}
        {Array.from({ length: 12 }, (_, index) => {
          const emote = hyperemotes[index % hyperemotes.length];
          const animations = ['floatUp', 'floatUpLeft', 'floatUpRight', 'spiralUp'];
          const animationType = animations[index % animations.length];
          const delay = (index * 0.3);
          const duration = 4 + (index % 3);
          const leftPosition = 10 + (index * 7) % 80;
          
          return (
            <div
              key={`${donation.id}-${emote.id}-${index}`}
              className="absolute pointer-events-none"
              style={{
                left: `${leftPosition}%`,
                animation: `${animationType} ${duration}s ease-out ${delay}s infinite`,
                zIndex: 40 + index
              }}
            >
              <img
                src={emote.src}
                alt={emote.name}
                className="w-12 h-12 sm:w-16 sm:h-16"
                style={{
                  filter: `hue-rotate(${index * 30}deg) brightness(1.2)`,
                }}
              />
            </div>
          );
        })}
      </div>
    );
  }

  // Regular donation alert
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
        
        @keyframes blink {
          0%, 100% { border-color: transparent }
          50% { border-color: white }
        }
        
        .alert-enter {
          animation: alertFadeIn 0.5s ease-out;
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
      `}</style>

      <div className={`
        fixed bottom-8 left-1/2 transform -translate-x-1/2 p-4 z-50
        ${isVisible ? 'opacity-100' : 'opacity-0'}
        transition-opacity duration-500
      `}>
        <div className="alert-card alert-enter min-w-[180px] max-w-[320px] min-h-[120px] relative flex flex-col justify-center items-center p-3">
          {/* Content Container with proper z-index */}
          <div className="relative z-10 text-center text-white w-full">
            {/* Alert Header */}
            <div className="mb-2">
              <h2 className="text-base font-bold mb-1">New Donation!</h2>
              <div className="flex flex-col items-center gap-0.5 text-xs font-semibold">
                <span>{donation.name}</span>
                <span className="text-green-400">donated ₹{donation.amount}</span>
              </div>
            </div>

            {/* Voice Message Indicator */}
            {donation.voice_message_url && (
              <div className="mb-2">
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full text-white text-sm animate-pulse">
                  <Music className="w-4 h-4" />
                  <span className="font-medium">🎵 Voice Message</span>
                </div>
              </div>
            )}

            {/* Message with Typing Effect */}
            {donation.message && (
              <div>
                <div className="text-xs leading-relaxed p-2 bg-white/10 rounded-lg backdrop-blur-sm min-h-[30px] flex items-center justify-center">
                  <span className="break-words text-center">
                    {donation.voice_message_url ? donation.message : displayedMessage}
                    {isTyping && <span className="animate-pulse border-r-2 border-white ml-1">|</span>}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};