import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Brain } from 'lucide-react';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message?: string;
  voice_message_url?: string;
  is_hyperemote?: boolean;
  tts_audio_url?: string;
}

interface MrIqmasterAlertDisplayProps {
  donation: Donation | null;
  isVisible?: boolean;
}

export const MrIqmasterAlertDisplay = ({ donation, isVisible = true }: MrIqmasterAlertDisplayProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [gifs, setGifs] = useState<string[]>([]);

  useEffect(() => {
    loadGifs();
  }, []);

  const loadGifs = async () => {
    const { data, error } = await supabase.storage
      .from('mriqmaster-gifs')
      .list();

    if (error) {
      console.error('Error loading GIFs:', error);
      return;
    }

    if (data) {
      const gifUrls = data
        .filter(file => file.name.endsWith('.gif'))
        .map(file => {
          const { data: urlData } = supabase.storage
            .from('mriqmaster-gifs')
            .getPublicUrl(file.name);
          return urlData.publicUrl;
        });
      setGifs(gifUrls);
    }
  };

  useEffect(() => {
    if (!donation?.message || donation.is_hyperemote || donation.voice_message_url) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    setDisplayedText('');
    let currentIndex = 0;
    const text = donation.message;

    const typingInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, [donation]);

  if (!isVisible || !donation) {
    return null;
  }

  // Hyperemote rain effect
  if (donation.is_hyperemote && gifs.length > 0) {
    const animations = ['floatUp', 'floatUpLeft', 'floatUpRight', 'spiralUp'];
    
    return (
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <style>{`
          @keyframes floatUp {
            0% { transform: translateY(100vh) scale(0.8) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-120vh) scale(1.2) rotate(360deg); opacity: 0; }
          }
          @keyframes floatUpLeft {
            0% { transform: translateY(100vh) translateX(0) scale(0.8) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            50% { transform: translateY(0vh) translateX(-30vw) scale(1) rotate(180deg); }
            90% { opacity: 1; }
            100% { transform: translateY(-120vh) translateX(-50vw) scale(1.2) rotate(360deg); opacity: 0; }
          }
          @keyframes floatUpRight {
            0% { transform: translateY(100vh) translateX(0) scale(0.8) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            50% { transform: translateY(0vh) translateX(30vw) scale(1) rotate(-180deg); }
            90% { opacity: 1; }
            100% { transform: translateY(-120vh) translateX(50vw) scale(1.2) rotate(-360deg); opacity: 0; }
          }
          @keyframes spiralUp {
            0% { transform: translateY(100vh) rotate(0deg) scale(0.8); opacity: 0; }
            10% { opacity: 1; }
            25% { transform: translateY(75vh) translateX(20vw) rotate(90deg) scale(0.9); }
            50% { transform: translateY(50vh) translateX(-20vw) rotate(180deg) scale(1); }
            75% { transform: translateY(25vh) translateX(20vw) rotate(270deg) scale(1.1); }
            90% { opacity: 1; }
            100% { transform: translateY(-120vh) rotate(360deg) scale(1.2); opacity: 0; }
          }
        `}</style>
        {Array.from({ length: 30 }).map((_, index) => {
          const gif = gifs[index % gifs.length];
          const animation = animations[index % animations.length];
          const delay = (index * 0.3) % 3;
          const left = 10 + (index * 7) % 80;
          const size = 80 + (index % 3) * 40;

          return (
            <img
              key={index}
              src={gif}
              alt="Hyperemote"
              className="absolute"
              style={{
                left: `${left}%`,
                bottom: '-20vh',
                width: `${size}px`,
                height: `${size}px`,
                animation: `${animation} ${8 + (index % 3)}s ease-in-out ${delay}s`,
                filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.5))',
              }}
            />
          );
        })}
      </div>
    );
  }

  // Regular donation alert
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 p-8">
      <div className="bg-gradient-to-br from-cyan-900/95 via-cyan-800/95 to-teal-900/95 backdrop-blur-xl rounded-3xl p-12 max-w-4xl w-full shadow-2xl border-4 border-cyan-400 animate-in fade-in zoom-in duration-500">
        <div className="flex items-center justify-center gap-6 mb-8">
          <div className="w-20 h-20 rounded-full bg-cyan-400/20 flex items-center justify-center animate-pulse">
            <Brain className="w-12 h-12 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-6xl font-bold text-white mb-2">{donation.name}</h2>
            <p className="text-4xl font-semibold text-cyan-300">₹{donation.amount}</p>
          </div>
        </div>

        {donation.voice_message_url && (
          <div className="mt-6 p-6 bg-cyan-950/50 rounded-2xl border-2 border-cyan-400/50">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-cyan-400/30 flex items-center justify-center animate-pulse">
                <span className="text-3xl">🎤</span>
              </div>
              <p className="text-3xl font-semibold text-cyan-200">Voice Message</p>
            </div>
          </div>
        )}

        {donation.message && !donation.voice_message_url && (
          <div className="mt-6 p-8 bg-cyan-950/50 rounded-2xl border-2 border-cyan-400/50">
            <p className="text-3xl text-white leading-relaxed">
              {displayedText}
              {isTyping && <span className="animate-pulse">|</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
