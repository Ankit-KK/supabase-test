import React, { useState, useEffect } from 'react';
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

  // Typing effect for messages
  useEffect(() => {
    if (!donation?.message || !isVisible) {
      setDisplayedMessage('');
      setIsTyping(false);
      return;
    }

    if (donation.voice_message_url) {
      // For voice messages, show full text immediately
      setDisplayedMessage(donation.message);
      return;
    }

    // Typing effect for text messages
    setIsTyping(true);
    setDisplayedMessage('');
    
    let index = 0;
    const message = donation.message;
    
    const typeInterval = setInterval(() => {
      if (index < message.length) {
        setDisplayedMessage(prev => (prev || '') + message[index]);
        index++;
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);
      }
    }, 50);

    return () => clearInterval(typeInterval);
  }, [donation?.message, donation?.voice_message_url, isVisible]);

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
        
        .alert-enter {
          animation: alertFadeIn 0.5s ease-out;
        }
        
        .hyperemote-float {
          animation: hyperemoteFloat 3s ease-in-out infinite;
        }
        
        .hyperemote-glow {
          animation: hyperemotePulse 2s ease-in-out infinite;
        }
      `}</style>

      <div className={`
        alert-enter flex items-center justify-center min-h-screen p-4
        ${isVisible ? 'opacity-100' : 'opacity-0'}
        transition-opacity duration-500
      `}>
        <div 
          className={`
            relative max-w-2xl w-full mx-auto rounded-2xl border-2 p-8
            ${donation.is_hyperemote 
              ? 'hyperemote-glow hyperemote-float bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border-yellow-400/50' 
              : 'bg-white/95 border-gray-200/50 shadow-2xl'
            }
            backdrop-blur-sm
          `}
          style={{
            borderColor: donation.is_hyperemote ? `${streamerBrandColor}80` : undefined
          }}
        >
          {/* Hyperemote Celebration Effects */}
          {donation.is_hyperemote && (
            <div className="absolute -top-4 -right-4">
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

          {/* Alert Header */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {donation.is_hyperemote ? '🎉 HYPEREMOTE! 🎉' : 'New Donation!'}
            </h2>
            <div className="flex items-center justify-center gap-2 text-2xl font-semibold">
              <span className="text-gray-800">{donation.name}</span>
              <span className="text-green-600">donated ₹{donation.amount}</span>
            </div>
          </div>

          {/* Voice Message */}
          {donation.voice_message_url && (
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-800">
                <Music className="w-5 h-5" />
                <span className="font-medium">Voice Message</span>
              </div>
              <audio
                src={donation.voice_message_url}
                autoPlay
                controls
                className="mt-3 mx-auto block max-w-full"
              />
            </div>
          )}

          {/* Message with Typing Effect */}
          {donation.message && (
            <div className="text-center">
              <div 
                className={`
                  text-xl leading-relaxed p-4 rounded-lg min-h-[60px] flex items-center justify-center
                  ${donation.is_hyperemote 
                    ? 'bg-white/90 text-gray-800 border-2 border-yellow-400/30' 
                    : 'bg-gray-50 text-gray-700'
                  }
                `}
              >
                <span>
                  {donation.voice_message_url ? donation.message : displayedMessage}
                  {isTyping && <span className="animate-pulse">|</span>}
                </span>
              </div>
            </div>
          )}

          {/* Streamer Branding */}
          <div className="mt-6 text-center">
            <div 
              className="inline-block px-4 py-1 rounded-full text-white text-sm font-medium"
              style={{ backgroundColor: streamerBrandColor }}
            >
              Thank you for supporting {streamerName}!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};