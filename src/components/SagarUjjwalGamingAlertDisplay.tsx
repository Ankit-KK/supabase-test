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
}

export const SagarUjjwalGamingAlertDisplay = ({ 
  donation, 
  isVisible,
  streamerBrandColor = "#ef4444",
  streamerName = "SAGAR UJJWAL GAMING"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div 
        className="bg-gradient-to-r from-red-600/90 to-red-700/90 backdrop-blur-sm text-white p-8 rounded-2xl shadow-2xl max-w-2xl w-full animate-in fade-in slide-in-from-bottom-4 duration-500"
        style={{
          boxShadow: `0 0 40px rgba(239, 68, 68, 0.4)`,
        }}
      >
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <h2 className="text-3xl font-bold">{donation.name}</h2>
            {donation.voice_message_url && (
              <Music className="w-8 h-8 text-red-200 animate-pulse" />
            )}
          </div>
          <p className="text-5xl font-bold text-red-100">₹{donation.amount}</p>
          {displayedMessage && (
            <p className="text-xl text-red-50 mt-4 break-words">
              {displayedMessage}
              {displayedMessage !== donation.message && (
                <span className="inline-block w-2 h-6 bg-red-200 ml-1 animate-pulse" />
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};