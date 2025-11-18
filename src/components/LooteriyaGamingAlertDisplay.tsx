import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Donation {
  name: string;
  amount: number;
  message?: string;
  voice_message_url?: string;
  is_hyperemote?: boolean;
  selected_gif_id?: string;
}

interface LooteriyaGamingAlertDisplayProps {
  donation: Donation | null;
  isVisible: boolean;
  streamerName?: string;
  streamerBrandColor?: string;
}

export const LooteriyaGamingAlertDisplay: React.FC<LooteriyaGamingAlertDisplayProps> = ({
  donation,
  isVisible,
  streamerName = "Looteriya Gaming",
  streamerBrandColor = "#f59e0b"
}) => {
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [availableGifs, setAvailableGifs] = useState<string[]>([]);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageIndexRef = useRef(0);

  // Fetch available GIFs from Supabase storage
  useEffect(() => {
    const fetchGifs = async () => {
      try {
        const { data: files, error } = await supabase.storage
          .from('looteriya-gifs')
          .list();

        if (error) {
          console.error('Error fetching GIFs:', error);
          return;
        }

        if (files) {
          const gifUrls = files
            .filter(file => file.name.endsWith('.gif'))
            .map(file => {
              const { data } = supabase.storage
                .from('looteriya-gifs')
                .getPublicUrl(file.name);
              return data.publicUrl;
            });
          
          setAvailableGifs(gifUrls);
          console.log('Loaded GIFs for Looteriya Gaming:', gifUrls.length);
        }
      } catch (error) {
        console.error('Error loading GIFs:', error);
      }
    };

    fetchGifs();
  }, []);

  // Typing animation effect
  useEffect(() => {
    if (!donation || !isVisible) {
      setDisplayedMessage('');
      messageIndexRef.current = 0;
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      setIsTyping(false);
      return;
    }

    // For voice messages, show full message immediately
    if (donation.voice_message_url) {
      setDisplayedMessage(donation.message || '');
      setIsTyping(false);
      return;
    }

    // For text messages, start typing animation
    const fullMessage = donation.message || '';
    if (!fullMessage) {
      setDisplayedMessage('');
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    setDisplayedMessage('');
    messageIndexRef.current = 0;

    typingIntervalRef.current = setInterval(() => {
      messageIndexRef.current += 1;
      const currentText = fullMessage.substring(0, messageIndexRef.current);
      setDisplayedMessage(currentText);

      if (messageIndexRef.current >= fullMessage.length) {
        setIsTyping(false);
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
      }
    }, 50);

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
  }, [donation, isVisible]);

  if (!donation || !isVisible) {
    return null;
  }

  // Helper function to get GIF for rain effect
  const getGifForRain = (index: number): string => {
    if (availableGifs.length === 0) return '';
    return availableGifs[index % availableGifs.length];
  };

  // Render hyperemote rain effect
  if (donation.is_hyperemote) {
    const animations = ['floatUp', 'floatUpLeft', 'floatUpRight', 'spiralUp'];
    
    return (
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <style>
          {`
            @keyframes floatUp {
              0% {
                transform: translateY(100vh) scale(0.5) rotate(0deg);
                opacity: 0;
              }
              10% {
                opacity: 1;
              }
              90% {
                opacity: 1;
              }
              100% {
                transform: translateY(-20vh) scale(1.2) rotate(360deg);
                opacity: 0;
              }
            }

            @keyframes floatUpLeft {
              0% {
                transform: translateY(100vh) translateX(0) scale(0.5) rotate(0deg);
                opacity: 0;
              }
              10% {
                opacity: 1;
              }
              90% {
                opacity: 1;
              }
              100% {
                transform: translateY(-20vh) translateX(-30vw) scale(1.2) rotate(-360deg);
                opacity: 0;
              }
            }

            @keyframes floatUpRight {
              0% {
                transform: translateY(100vh) translateX(0) scale(0.5) rotate(0deg);
                opacity: 0;
              }
              10% {
                opacity: 1;
              }
              90% {
                opacity: 1;
              }
              100% {
                transform: translateY(-20vh) translateX(30vw) scale(1.2) rotate(360deg);
                opacity: 0;
              }
            }

            @keyframes spiralUp {
              0% {
                transform: translateY(100vh) translateX(0) scale(0.5) rotate(0deg);
                opacity: 0;
              }
              10% {
                opacity: 1;
              }
              25% {
                transform: translateY(60vh) translateX(15vw) scale(0.8) rotate(90deg);
              }
              50% {
                transform: translateY(40vh) translateX(-15vw) scale(1) rotate(180deg);
              }
              75% {
                transform: translateY(20vh) translateX(15vw) scale(1.1) rotate(270deg);
              }
              90% {
                opacity: 1;
              }
              100% {
                transform: translateY(-20vh) translateX(0) scale(1.2) rotate(360deg);
                opacity: 0;
              }
            }
          `}
        </style>
        
        {/* Generate 12 emotes with all available GIFs */}
        {[...Array(12)].map((_, index) => {
          const gifUrl = getGifForRain(index);
          if (!gifUrl) return null;
          
          const animation = animations[index % animations.length];
          const duration = animation === 'spiralUp' ? 7 : animation === 'floatUp' ? 5 : 6;
          const delay = index * 0.3;
          const startPosition = (index * 8.33) % 100;

          return (
            <img
              key={index}
              src={gifUrl}
              alt="Hyperemote"
              className="absolute w-16 h-16 object-contain"
              style={{
                left: `${startPosition}%`,
                bottom: '-100px',
                animation: `${animation} ${duration}s ease-in-out ${delay}s forwards`,
                filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.5))',
              }}
            />
          );
        })}
      </div>
    );
  }

  // Regular donation alert
  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-11/12 max-w-2xl z-50 pointer-events-none">
      <div 
        className="relative px-8 py-6 rounded-2xl shadow-2xl backdrop-blur-sm"
        style={{
          background: `linear-gradient(135deg, ${streamerBrandColor}15 0%, ${streamerBrandColor}25 100%)`,
          border: `2px solid ${streamerBrandColor}40`,
          boxShadow: `0 8px 32px ${streamerBrandColor}30, inset 0 0 20px ${streamerBrandColor}10`
        }}
      >
        <div className="flex items-center gap-4 mb-3">
          <div 
            className="text-3xl font-black tracking-tight"
            style={{ color: streamerBrandColor }}
          >
            {donation.name}
          </div>
          <div 
            className="text-2xl font-bold px-4 py-1 rounded-full"
            style={{
              background: streamerBrandColor,
              color: '#000'
            }}
          >
            ₹{donation.amount}
          </div>
        </div>

        {donation.voice_message_url && (
          <div 
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-2"
            style={{
              background: `${streamerBrandColor}20`,
              color: streamerBrandColor
            }}
          >
            🎤 Voice Message
          </div>
        )}

        {(donation.message || isTyping) && (
          <div className="text-xl text-white font-medium leading-relaxed">
            {displayedMessage}
            {isTyping && (
              <span 
                className="inline-block w-1 h-5 ml-1 animate-pulse"
                style={{ background: streamerBrandColor }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
