import { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message?: string;
  voice_message_url?: string;
  is_hyperemote?: boolean;
}

interface NotYourKweenAlertDisplayProps {
  donation: Donation;
  scale?: number;
}

export const NotYourKweenAlertDisplay = ({ donation, scale = 1.0 }: NotYourKweenAlertDisplayProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [gifUrls, setGifUrls] = useState<string[]>([]);
  const [floatingGifs, setFloatingGifs] = useState<Array<{ id: number; url: string; delay: number; animation: string }>>([]);

  const isVoiceMessage = !!donation.voice_message_url;
  const isHyperemote = donation.is_hyperemote;

  useEffect(() => {
    if (isHyperemote) {
      loadGifs();
    }
  }, [isHyperemote]);

  useEffect(() => {
    if (isHyperemote && gifUrls.length > 0) {
      const animations = ['floatUp', 'floatUpLeft', 'floatUpRight', 'spiralUp'];
      const gifs = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        url: gifUrls[i % gifUrls.length],
        delay: i * 200,
        animation: animations[i % animations.length],
      }));
      setFloatingGifs(gifs);
    }
  }, [isHyperemote, gifUrls]);

  const loadGifs = async () => {
    const { data, error } = await supabase.storage.from('notyourkween-gifs').list();
    if (!error && data) {
      const urls = data.map(file => 
        supabase.storage.from('notyourkween-gifs').getPublicUrl(file.name).data.publicUrl
      );
      setGifUrls(urls);
    }
  };

  useEffect(() => {
    if (donation.message && !isVoiceMessage && !isHyperemote) {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex <= donation.message!.length) {
          setDisplayedText(donation.message!.substring(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [donation.message, isVoiceMessage, isHyperemote]);

  if (isHyperemote) {
    return (
      <div className="fixed inset-0 bg-black overflow-hidden pointer-events-none">
        {floatingGifs.map((gif) => (
          <img
            key={gif.id}
            src={gif.url}
            alt="celebration"
            className={`absolute w-24 h-24 object-contain animate-${gif.animation}`}
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${gif.delay}ms`,
              bottom: '-100px',
            }}
          />
        ))}
        <style>{`
          @keyframes floatUp {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(-120vh) rotate(360deg); opacity: 0; }
          }
          @keyframes floatUpLeft {
            0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
            100% { transform: translate(-30vw, -120vh) rotate(-360deg); opacity: 0; }
          }
          @keyframes floatUpRight {
            0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
            100% { transform: translate(30vw, -120vh) rotate(360deg); opacity: 0; }
          }
          @keyframes spiralUp {
            0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
            50% { transform: translate(20vw, -60vh) rotate(180deg) scale(1.2); opacity: 1; }
            100% { transform: translate(-20vw, -120vh) rotate(360deg) scale(0.8); opacity: 0; }
          }
          .animate-floatUp { animation: floatUp 6s ease-out forwards; }
          .animate-floatUpLeft { animation: floatUpLeft 6s ease-out forwards; }
          .animate-floatUpRight { animation: floatUpRight 6s ease-out forwards; }
          .animate-spiralUp { animation: spiralUp 6s ease-out forwards; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div 
        className="absolute bottom-[10%] left-1/2 text-white text-center flex flex-col items-center gap-1.5 px-8 py-4 rounded-xl opacity-100 transition-opacity duration-600"
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
        {isVoiceMessage && (
          <div className="inline-flex items-center gap-2 text-sm">
            <span>🎵 Voice Message</span>
          </div>
        )}

        {/* Message with Typing Effect */}
        {donation.message && !isVoiceMessage && (
          <div 
            className="text-base font-normal min-h-[1.2em]"
            style={{ opacity: 0.9, color: '#f9f9f9' }}
          >
            "{displayedText}"
            {displayedText !== donation.message && (
              <span className="animate-pulse ml-1">|</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
