import { useEffect, useState } from 'react';
import { Music } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Donation {
  name: string;
  amount: number;
  message?: string;
  voice_message_url?: string;
  is_hyperemote?: boolean;
  selected_gif_id?: string;
}

interface SagarUjjwalGamingAlertDisplayProps {
  donation: Donation | null;
  isVisible: boolean;
  streamerBrandColor?: string;
  streamerName?: string;
  scale?: number;
}

export const SagarUjjwalGamingAlertDisplay = ({ 
  donation, 
  isVisible,
  streamerBrandColor = "#ef4444",
  streamerName = "SAGAR UJJWAL GAMING",
  scale = 1.0
}: SagarUjjwalGamingAlertDisplayProps) => {
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [availableGifs, setAvailableGifs] = useState<string[]>([]);

  // Fetch available GIFs from storage
  useEffect(() => {
    const fetchGifs = async () => {
      try {
        const { data: files, error } = await supabase
          .storage
          .from('sagarujjwalgaming-gifs')
          .list();

        if (error) {
          console.error('Error fetching GIFs:', error);
          return;
        }

        if (files) {
          const gifUrls = files
            .filter(file => file.name.endsWith('.gif'))
            .map(file => {
              const { data } = supabase
                .storage
                .from('sagarujjwalgaming-gifs')
                .getPublicUrl(file.name);
              return data.publicUrl;
            });
          
          setAvailableGifs(gifUrls);
        }
      } catch (err) {
        console.error('Error loading GIFs:', err);
      }
    };

    fetchGifs();
  }, []);

  // Typing animation for text messages
  useEffect(() => {
    if (!donation?.message || donation.voice_message_url) {
      setDisplayedMessage(donation?.message || '');
      return;
    }

    let currentIndex = 0;
    const message = donation.message;
    setDisplayedMessage('');

    const typingInterval = setInterval(() => {
      if (currentIndex < message.length) {
        setDisplayedMessage(message.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, [donation]);

  if (!isVisible || !donation) {
    return null;
  }

  // Hyperemote rain effect
  if (donation.is_hyperemote) {
    const getGifForRain = () => {
      if (donation.selected_gif_id && availableGifs.length > 0) {
        const selectedGif = availableGifs.find(url => url.includes(donation.selected_gif_id!));
        return selectedGif ? [selectedGif] : availableGifs;
      }
      return availableGifs;
    };

    const gifsForRain = getGifForRain();
    const animations = ['floatUp', 'floatUpLeft', 'floatUpRight', 'spiralUp'];

    return (
      <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
        <style>{`
          @keyframes floatUp {
            from {
              transform: translateY(100vh) scale(0.8);
              opacity: 0.7;
            }
            to {
              transform: translateY(-120vh) scale(1);
              opacity: 0;
            }
          }
          
          @keyframes floatUpLeft {
            from {
              transform: translate(0, 100vh) scale(0.8);
              opacity: 0.7;
            }
            to {
              transform: translate(-30vw, -120vh) scale(1);
              opacity: 0;
            }
          }
          
          @keyframes floatUpRight {
            from {
              transform: translate(0, 100vh) scale(0.8);
              opacity: 0.7;
            }
            to {
              transform: translate(30vw, -120vh) scale(1);
              opacity: 0;
            }
          }
          
          @keyframes spiralUp {
            from {
              transform: translate(0, 100vh) rotate(0deg) scale(0.8);
              opacity: 0.7;
            }
            to {
              transform: translate(0, -120vh) rotate(720deg) scale(1);
              opacity: 0;
            }
          }
          
          .floatUp { animation: floatUp 8s ease-out forwards; }
          .floatUpLeft { animation: floatUpLeft 8s ease-out forwards; }
          .floatUpRight { animation: floatUpRight 8s ease-out forwards; }
          .spiralUp { animation: spiralUp 8s ease-out forwards; }
        `}</style>
        
        {gifsForRain.length > 0 && Array.from({ length: 20 }).map((_, i) => {
          const gifUrl = gifsForRain[i % gifsForRain.length];
          const animationClass = animations[i % animations.length];
          const left = (i * 11) % 100;
          const delay = (i * 0.3) % 3;
          const size = 80 + (i % 3) * 20;
          
          return (
            <img
              key={i}
              src={gifUrl}
              alt="Hyperemote"
              className={`absolute ${animationClass}`}
              style={{
                left: `${left}%`,
                width: `${size}px`,
                height: `${size}px`,
                animationDelay: `${delay}s`,
                filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.6))',
              }}
            />
          );
        })}
      </div>
    );
  }

  // Regular donation alert
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div 
        className={`
          absolute bottom-[10%] left-1/2
          text-white text-center
          flex flex-col items-center gap-1.5
          px-8 py-4 rounded-xl
          ${isVisible ? 'opacity-100' : 'opacity-0'}
          transition-opacity duration-600
        `}
        style={{
          background: 'linear-gradient(90deg, rgba(0, 122, 255, 0.6), rgba(144, 0, 255, 0.6))',
          boxShadow: '0 0 25px rgba(144, 0, 255, 0.4)',
          letterSpacing: '0.4px',
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: 'bottom center',
        }}
      >
        {/* Name and Amount */}
        <div className="text-[1.2rem]">
          <span className="font-bold">{donation.name}</span> donated{' '}
          <span className="font-bold">₹{donation.amount}</span>
        </div>

        {/* Voice Message Indicator */}
        {donation.voice_message_url && (
          <div className="inline-flex items-center gap-2 text-sm">
            <Music className="w-4 h-4" />
            <span>🎵 Voice Message</span>
          </div>
        )}

        {/* Message with Typing Effect */}
        {displayedMessage && (
          <div 
            className="text-base font-normal min-h-[1.2em]"
            style={{ opacity: 0.9, color: '#f9f9f9' }}
          >
            "{displayedMessage}"
            {displayedMessage !== donation.message && (
              <span className="animate-pulse ml-1">|</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};