import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  voice_message_url?: string;
  created_at: string;
  is_hyperemote: boolean;
  selected_gif_id?: string;
}

interface DamaskPlaysAlertDisplayProps {
  donation: Donation | null;
  isVisible: boolean;
  streamerBrandColor?: string;
  streamerName?: string;
}

export const DamaskPlaysAlertDisplay: React.FC<DamaskPlaysAlertDisplayProps> = ({
  donation,
  isVisible,
  streamerBrandColor = '#10b981',
  streamerName = 'Damask plays'
}) => {
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [availableGifs, setAvailableGifs] = useState<{ name: string; url: string }[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const donationIdRef = useRef<string | null>(null);

  // Fetch available GIFs from storage
  useEffect(() => {
    const fetchGifs = async () => {
      try {
        const { data, error } = await supabase.storage
          .from('damask-gif')
          .list();

        if (error) {
          console.error('Error fetching GIFs:', error);
          return;
        }

        if (data) {
          const gifs = data
            .filter(file => file.name.endsWith('.gif'))
            .map(file => ({
              name: file.name,
              url: supabase.storage.from('damask-gif').getPublicUrl(file.name).data.publicUrl
            }));
          setAvailableGifs(gifs);
          console.log('Loaded GIFs for Damask plays:', gifs);
        }
      } catch (err) {
        console.error('Failed to fetch GIFs:', err);
      }
    };

    fetchGifs();
  }, []);

  // Typing effect for messages
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setDisplayedMessage('');
    setIsTyping(false);

    if (!donation?.message || !isVisible) {
      return;
    }

    if (donationIdRef.current !== donation.id) {
      donationIdRef.current = donation.id;
    }

    if (donation.voice_message_url) {
      setDisplayedMessage(donation.message);
      return;
    }

    setIsTyping(true);
    let index = 0;
    const message = donation.message;
    
    intervalRef.current = setInterval(() => {
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

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [donation?.id, donation?.message, donation?.voice_message_url, isVisible]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  if (!donation || !isVisible) {
    return null;
  }

  // Get the selected GIF URL or use all GIFs for rain
  const getGifForRain = () => {
    if (donation.selected_gif_id && availableGifs.length > 0) {
      const selectedGif = availableGifs.find(gif => gif.name === donation.selected_gif_id);
      return selectedGif ? [selectedGif] : availableGifs;
    }
    return availableGifs;
  };

  // Render hyperemote rain effect with animated GIFs
  if (donation.is_hyperemote) {
    const gifsForRain = getGifForRain();
    
    return (
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {/* Multiple animated GIF emotes with different animations */}
        {gifsForRain.length > 0 && (
          <>
            {[...Array(12)].map((_, i) => {
              const gif = gifsForRain[i % gifsForRain.length];
              const animations = ['floatUp', 'floatUpLeft', 'floatUpRight', 'spiralUp'];
              const animation = animations[i % animations.length];
              const delay = (i * 0.3).toFixed(1);
              const duration = animation === 'spiralUp' ? 7 : (4 + (i % 3));
              const startPosition = (i * 8) % 100;
              
              return (
                <div
                  key={i}
                  className="absolute bottom-0 w-16 h-16"
                  style={{
                    left: `${startPosition}%`,
                    animation: `${animation} ${duration}s ease-out ${delay}s forwards`,
                  }}
                >
                  <img 
                    src={gif.url} 
                    alt="hyperemote" 
                    className="w-full h-full object-contain"
                    style={{
                      imageRendering: 'auto',
                    }}
                  />
                </div>
              );
            })}
          </>
        )}

        <style>{`
          @keyframes floatUp {
            0% {
              transform: translateY(0) scale(1) rotate(0deg);
              opacity: 1;
            }
            50% {
              transform: translateY(-50vh) scale(1.2) rotate(180deg);
              opacity: 0.8;
            }
            100% {
              transform: translateY(-100vh) scale(0.8) rotate(360deg);
              opacity: 0;
            }
          }

          @keyframes floatUpLeft {
            0% {
              transform: translate(0, 0) scale(1) rotate(0deg);
              opacity: 1;
            }
            50% {
              transform: translate(-30vw, -50vh) scale(1.3) rotate(-180deg);
              opacity: 0.8;
            }
            100% {
              transform: translate(-50vw, -100vh) scale(0.7) rotate(-360deg);
              opacity: 0;
            }
          }

          @keyframes floatUpRight {
            0% {
              transform: translate(0, 0) scale(1) rotate(0deg);
              opacity: 1;
            }
            50% {
              transform: translate(30vw, -50vh) scale(1.3) rotate(180deg);
              opacity: 0.8;
            }
            100% {
              transform: translate(50vw, -100vh) scale(0.7) rotate(360deg);
              opacity: 0;
            }
          }

          @keyframes spiralUp {
            0% {
              transform: translate(0, 0) scale(1) rotate(0deg);
              opacity: 1;
            }
            25% {
              transform: translate(20vw, -25vh) scale(1.4) rotate(90deg);
              opacity: 0.9;
            }
            50% {
              transform: translate(-20vw, -50vh) scale(1.2) rotate(270deg);
              opacity: 0.8;
            }
            75% {
              transform: translate(15vw, -75vh) scale(1.1) rotate(450deg);
              opacity: 0.6;
            }
            100% {
              transform: translate(0, -100vh) scale(0.8) rotate(720deg);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    );
  }

  // Regular donation alert (non-hyperemote)
  return (
    <div className="fixed bottom-0 left-0 right-0 flex items-center justify-center p-8 pointer-events-none z-50">
      <div 
        className="backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-2xl w-full animate-in slide-in-from-bottom-5 duration-500"
        style={{
          background: `linear-gradient(135deg, ${streamerBrandColor}15 0%, ${streamerBrandColor}05 100%)`,
          border: `2px solid ${streamerBrandColor}40`,
        }}
      >
        <div className="flex items-center gap-6 mb-4">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${streamerBrandColor} 0%, ${streamerBrandColor}dd 100%)`,
              color: 'white',
            }}
          >
            ₹
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold text-white">{donation.name}</h3>
              <span 
                className="text-2xl font-bold px-4 py-1 rounded-full"
                style={{
                  background: `${streamerBrandColor}30`,
                  color: streamerBrandColor,
                }}
              >
                ₹{donation.amount}
              </span>
            </div>
            {donation.voice_message_url && (
              <div className="flex items-center gap-2 text-white/80">
                <span className="text-lg">🎤 Voice Message</span>
              </div>
            )}
          </div>
        </div>
        
        {donation.message && (
          <div className="mt-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm">
            <p className="text-xl text-white leading-relaxed">
              {displayedMessage}
              {isTyping && <span className="animate-pulse">|</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
