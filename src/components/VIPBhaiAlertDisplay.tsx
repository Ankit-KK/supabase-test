import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AnimatedText from './AnimatedText';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string | null;
  is_hyperemote: boolean;
  voice_message_url: string | null;
}

interface VIPBhaiAlertDisplayProps {
  donation: Donation | null;
}

const VIPBhaiAlertDisplay: React.FC<VIPBhaiAlertDisplayProps> = ({ donation }) => {
  const [gifUrls, setGifUrls] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);

  // Handle null donation
  if (!donation) {
    return null;
  }

  useEffect(() => {
    const fetchGifs = async () => {
      if (!donation.is_hyperemote) return;
      
      const { data, error } = await supabase.storage
        .from('vipbhai-gifs')
        .list('', { limit: 100 });

      if (!error && data) {
        const gifs = data
          .filter(file => file.name.match(/\.(gif|png|jpg|jpeg)$/i))
          .map(file => {
            const { data: { publicUrl } } = supabase.storage
              .from('vipbhai-gifs')
              .getPublicUrl(file.name);
            return publicUrl;
          });
        setGifUrls(gifs);
      }
    };

    fetchGifs();
    setShowAlert(true);

    return () => setShowAlert(false);
  }, [donation.is_hyperemote]);

  if (donation.is_hyperemote && gifUrls.length > 0) {
    return (
      <div className="fixed inset-0 w-screen h-screen overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => {
          const randomGif = gifUrls[Math.floor(Math.random() * gifUrls.length)];
          const startX = Math.random() * 100;
          const animations = ['floatUp', 'floatUpLeft', 'floatUpRight', 'spiralUp'];
          const animation = animations[i % animations.length];
          const duration = 8 + Math.random() * 4;
          const delay = Math.random() * 2;
          const size = 80 + Math.random() * 80;

          return (
            <img
              key={`gif-${i}`}
              src={randomGif}
              alt="Celebration"
              className="absolute"
              style={{
                left: `${startX}%`,
                bottom: '-120px',
                width: `${size}px`,
                height: `${size}px`,
                objectFit: 'contain',
                animation: `${animation} ${duration}s ease-in-out ${delay}s forwards`,
                opacity: 0.9,
                filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.5))',
              }}
            />
          );
        })}
        <style>{`
          @keyframes floatUp {
            0% {
              transform: translateY(0) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translateY(-120vh) rotate(360deg);
              opacity: 0;
            }
          }
          @keyframes floatUpLeft {
            0% {
              transform: translate(0, 0) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translate(-30vw, -120vh) rotate(-360deg);
              opacity: 0;
            }
          }
          @keyframes floatUpRight {
            0% {
              transform: translate(0, 0) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translate(30vw, -120vh) rotate(360deg);
              opacity: 0;
            }
          }
          @keyframes spiralUp {
            0% {
              transform: translate(0, 0) rotate(0deg) scale(0.5);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            50% {
              transform: translate(20vw, -60vh) rotate(720deg) scale(1);
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translate(-20vw, -120vh) rotate(1080deg) scale(0.8);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center transition-opacity duration-500 ${
        showAlert ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="relative w-full max-w-2xl mx-auto px-8" style={{ bottom: '10%', left: '50%', transform: 'translateX(-50%)' }}>
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-2xl p-8 shadow-2xl border-4 border-white/30 backdrop-blur-md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-white">{donation.name}</span>
              <span className="text-4xl font-bold text-amber-300">₹{donation.amount}</span>
            </div>
            
            {donation.message && !donation.voice_message_url && (
              <div className="text-white text-2xl leading-relaxed">
                <AnimatedText text={donation.message} />
              </div>
            )}

            {donation.voice_message_url && (
              <div className="flex items-center gap-3 text-white text-xl">
                <span className="text-2xl">🎤</span>
                <span className="italic">"{donation.message || 'Voice message'}"</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VIPBhaiAlertDisplay;
