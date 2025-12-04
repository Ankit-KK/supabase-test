import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Music } from 'lucide-react';

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

interface ThunderXAlertDisplayProps {
  donation: Donation | null;
  isVisible: boolean;
  streamerBrandColor?: string;
  streamerName?: string;
  scale?: number;
}

export const ThunderXAlertDisplay: React.FC<ThunderXAlertDisplayProps> = ({
  donation,
  isVisible,
  streamerBrandColor = '#10b981',
  streamerName = 'THUNDERX',
  scale = 1.0
}) => {
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [availableGifs, setAvailableGifs] = useState<{ name: string; url: string }[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const donationIdRef = useRef<string | null>(null);

  // Fetch GIFs from storage
  useEffect(() => {
    const fetchGifs = async () => {
      try {
        const { data, error } = await supabase.storage
          .from('thunderx-gifs')
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
              url: supabase.storage.from('thunderx-gifs').getPublicUrl(file.name).data.publicUrl
            }));
          setAvailableGifs(gifs);
          console.log('Loaded GIFs for THUNDERX:', gifs);
        }
      } catch (err) {
        console.error('Failed to fetch GIFs:', err);
      }
    };

    fetchGifs();
  }, []);

  // Typing effect for text messages
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

    // Voice messages show full text immediately
    if (donation.voice_message_url) {
      setDisplayedMessage(donation.message);
      return;
    }

    // Text messages get typing animation
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
    }, 50); // 50ms per character

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

  // Helper to get GIF for rain
  const getGifForRain = () => {
    if (donation.selected_gif_id && availableGifs.length > 0) {
      const selectedGif = availableGifs.find(gif => gif.name === donation.selected_gif_id);
      if (selectedGif) return [selectedGif.url];
    }
    return availableGifs.map(gif => gif.url);
  };

  // Hyperemote Rain Effect
  if (donation.is_hyperemote) {
    const animations = ['floatUp', 'floatUpLeft', 'floatUpRight', 'spiralUp'];
    const gifsToShow = getGifForRain();
    
    return (
      <>
        <style>{`
          @keyframes floatUp {
            0% { transform: translateY(0) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-120vh) rotate(360deg); opacity: 0; }
          }
          @keyframes floatUpLeft {
            0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translate(-30vw, -120vh) rotate(-360deg); opacity: 0; }
          }
          @keyframes floatUpRight {
            0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translate(30vw, -120vh) rotate(360deg); opacity: 0; }
          }
          @keyframes spiralUp {
            0% { transform: translate(0, 0) rotate(0deg) scale(0.5); opacity: 0; }
            10% { opacity: 1; }
            50% { transform: translate(15vw, -60vh) rotate(720deg) scale(1); }
            90% { opacity: 1; }
            100% { transform: translate(-15vw, -120vh) rotate(1080deg) scale(0.5); opacity: 0; }
          }
        `}</style>
        
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => {
            const gif = gifsToShow[i % gifsToShow.length];
            const animation = animations[i % animations.length];
            const delay = Math.random() * 2;
            const duration = 8 + Math.random() * 4;
            const startX = Math.random() * 100;
            const size = 80 + Math.random() * 60;

            return (
              <img
                key={i}
                src={gif}
                alt="celebration"
                className="absolute"
                style={{
                  left: `${startX}%`,
                  bottom: '-150px',
                  width: `${size}px`,
                  height: `${size}px`,
                  animation: `${animation} ${duration}s ease-in-out ${delay}s`,
                  filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.6))',
                  zIndex: 9999,
                }}
              />
            );
          })}
        </div>
      </>
    );
  }

  // Regular Donation Alert
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div 
        className="absolute bottom-[10%] left-1/2 text-white text-center flex flex-col items-center gap-1.5 px-8 py-4 rounded-xl"
        style={{
          background: 'linear-gradient(90deg, rgba(0, 122, 255, 0.6), rgba(144, 0, 255, 0.6))',
          boxShadow: '0 0 25px rgba(144, 0, 255, 0.4)',
          letterSpacing: '0.4px',
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: 'bottom center',
        }}
      >
        <div className="text-[1.2rem]">
          <span className="font-bold">{donation.name}</span> donated{' '}
          <span className="font-bold">₹{donation.amount}</span>
        </div>

        {donation.voice_message_url && (
          <div className="inline-flex items-center gap-2 text-sm">
            <Music className="w-4 h-4" />
            <span>🎵 Voice Message</span>
          </div>
        )}

        {(donation.message || isTyping) && (
          <div className="text-base font-normal min-h-[1.2em]" style={{ opacity: 0.9, color: '#f9f9f9' }}>
            "{donation.voice_message_url ? donation.message : displayedMessage}"
            {isTyping && <span className="animate-pulse ml-1">|</span>}
          </div>
        )}
      </div>
    </div>
  );
};