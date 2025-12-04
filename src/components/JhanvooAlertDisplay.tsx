import { useEffect, useState, useRef } from "react";
import { Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message?: string;
  is_hyperemote: boolean;
  voice_message_url?: string;
  created_at: string;
  selected_gif_id?: string;
}

interface JhanvooAlertDisplayProps {
  donation: Donation | null;
  isVisible: boolean;
  streamerBrandColor?: string;
  streamerName?: string;
  scale?: number;
}

export const JhanvooAlertDisplay = ({ 
  donation, 
  isVisible,
  streamerBrandColor = '#ec4899',
  streamerName = 'Jhanvoo',
  scale = 1.0
}: JhanvooAlertDisplayProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [availableGifs, setAvailableGifs] = useState<{ name: string; url: string }[]>([]);
  const [showRainEffect, setShowRainEffect] = useState(false);
  const donationIdRef = useRef<string | null>(null);

  // Fetch hyperemote GIFs from Supabase storage
  useEffect(() => {
    const loadGifs = async () => {
      const { data, error } = await supabase.storage
        .from('jhanvoo-gifs')
        .list();

      if (!error && data) {
        const gifFiles = data.filter(file => file.name.endsWith('.gif'));
        const gifs = gifFiles.map(file => ({
          name: file.name,
          url: supabase.storage.from('jhanvoo-gifs').getPublicUrl(file.name).data.publicUrl
        }));
        setAvailableGifs(gifs);
      }
    };

    loadGifs();
  }, []);

  // Typing effect for text messages
  useEffect(() => {
    if (donation && isVisible && donation.message && !donation.is_hyperemote) {
      // Check if this is a new donation
      if (donationIdRef.current !== donation.id) {
        donationIdRef.current = donation.id;
        
        // Show full message immediately for voice messages
        if (donation.voice_message_url) {
          setDisplayedText(donation.message);
          setIsTyping(false);
          return;
        }

        // Typing effect for text messages
        let currentIndex = 0;
        setDisplayedText("");
        setIsTyping(true);
        
        const typingInterval = setInterval(() => {
          if (currentIndex <= donation.message!.length) {
            setDisplayedText(donation.message!.substring(0, currentIndex));
            currentIndex++;
          } else {
            clearInterval(typingInterval);
            setIsTyping(false);
          }
        }, 50);

        return () => {
          clearInterval(typingInterval);
          setIsTyping(false);
        };
      }
    }
  }, [donation, isVisible]);

  // Hyperemote rain effect
  useEffect(() => {
    if (donation?.is_hyperemote && isVisible && availableGifs.length > 0) {
      setShowRainEffect(true);
      const timer = setTimeout(() => setShowRainEffect(false), 10000);
      return () => clearTimeout(timer);
    } else {
      setShowRainEffect(false);
    }
  }, [donation, isVisible, availableGifs]);

  const getGifForRain = (index: number) => {
    if (!availableGifs.length) return '';
    
    if (donation?.selected_gif_id) {
      const selectedGif = availableGifs.find(g => g.name === donation.selected_gif_id);
      if (selectedGif) return selectedGif.url;
    }
    
    return availableGifs[index % availableGifs.length].url;
  };

  if (!isVisible || !donation) return null;

  return (
    <>
      {/* Hyperemote Rain Effect */}
      {showRainEffect && availableGifs.length > 0 && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {[...Array(20)].map((_, index) => {
            const gifUrl = getGifForRain(index);
            const animations = ['floatUp', 'floatUpLeft', 'floatUpRight', 'spiralUp'];
            const animationClass = animations[Math.floor(Math.random() * animations.length)];
            const delay = (Math.random() * 2).toFixed(2);
            const duration = (8 + Math.random() * 4).toFixed(1);
            const left = (Math.random() * 90).toFixed(0);
            const size = (80 + Math.random() * 60).toFixed(0);
            
            return (
              <div
                key={`rain-${index}`}
                className={`absolute ${animationClass}`}
                style={{
                  left: `${left}%`,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
                  bottom: '-120px',
                  filter: 'drop-shadow(0 0 10px rgba(236, 72, 153, 0.6))',
                }}
              >
                <img 
                  src={gifUrl} 
                  alt="Hyperemote" 
                  className="object-contain opacity-90"
                  style={{ width: `${size}px`, height: `${size}px` }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Regular Alert Box */}
      {!donation.is_hyperemote && (
        <div className="fixed bottom-[10%] left-1/2 z-50 max-w-3xl w-full px-4"
          style={{
            transform: `translateX(-50%) scale(${scale})`,
            transformOrigin: 'bottom center',
          }}
        >
          <div 
            className="backdrop-blur-md px-8 py-4 rounded-xl border"
            style={{
              background: 'linear-gradient(90deg, rgba(236, 72, 153, 0.6), rgba(219, 39, 119, 0.6))',
              boxShadow: '0 0 25px rgba(236, 72, 153, 0.4)',
              borderColor: 'rgba(236, 72, 153, 0.5)',
              letterSpacing: '0.4px',
            }}
          >
            <div className="flex items-center gap-3 text-white">
              <Music className="w-6 h-6 text-yellow-300 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[1.2rem] font-bold leading-tight">
                  {donation.name} donated ₹{donation.amount}
                  {donation.voice_message_url && (
                    <span className="ml-2 text-yellow-300">🎵 Voice Message</span>
                  )}
                </p>
                {donation.message && (
                  <p className="text-base mt-1 break-words">
                    {displayedText}
                    {isTyping && <span className="animate-pulse">|</span>}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.9; }
          90% { opacity: 0.9; }
          100% { transform: translateY(-120vh) rotate(360deg); opacity: 0; }
        }
        @keyframes floatUpLeft {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.9; }
          90% { opacity: 0.9; }
          100% { transform: translate(-40vw, -120vh) rotate(-360deg); opacity: 0; }
        }
        @keyframes floatUpRight {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.9; }
          90% { opacity: 0.9; }
          100% { transform: translate(40vw, -120vh) rotate(360deg); opacity: 0; }
        }
        @keyframes spiralUp {
          0% { transform: translate(0, 0) rotate(0deg) scale(0.5); opacity: 0; }
          10% { opacity: 0.9; }
          50% { transform: translate(20vw, -60vh) rotate(720deg) scale(1); }
          90% { opacity: 0.9; }
          100% { transform: translate(-20vw, -120vh) rotate(1080deg) scale(0.5); opacity: 0; }
        }
        .floatUp { animation: floatUp 8s ease-out forwards; }
        .floatUpLeft { animation: floatUpLeft 9s ease-out forwards; }
        .floatUpRight { animation: floatUpRight 9s ease-out forwards; }
        .spiralUp { animation: spiralUp 10s ease-out forwards; }
      `}</style>
    </>
  );
};