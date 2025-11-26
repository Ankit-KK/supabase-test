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
}

export const NotYourKweenAlertDisplay = ({ donation }: NotYourKweenAlertDisplayProps) => {
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
    <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
      <div className="bg-gradient-to-br from-pink-600 to-purple-600 rounded-3xl shadow-2xl p-8 max-w-2xl w-full border-4 border-pink-300 animate-scale-in">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-white/20 p-4 rounded-full">
            <Crown className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-4xl font-bold text-white">{donation.name}</h2>
            <p className="text-2xl text-pink-100">₹{donation.amount}</p>
          </div>
        </div>
        
        {isVoiceMessage ? (
          <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
            <p className="text-xl text-white text-center flex items-center justify-center gap-3">
              <span className="text-3xl">🎤</span>
              Sent a Voice Message
            </p>
          </div>
        ) : donation.message ? (
          <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
            <p className="text-xl text-white leading-relaxed">{displayedText}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
