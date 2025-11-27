import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface JhanvooAlertDisplayProps {
  donation: {
    id: string;
    name: string;
    amount: number;
    message?: string;
    is_hyperemote?: boolean;
    voice_message_url?: string;
  } | null;
  isVisible: boolean;
}

export const JhanvooAlertDisplay = ({ donation, isVisible }: JhanvooAlertDisplayProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [hyperemoteGifs, setHyperemoteGifs] = useState<string[]>([]);
  const [showRainEffect, setShowRainEffect] = useState(false);

  // Fetch hyperemote GIFs from Supabase storage
  useEffect(() => {
    const fetchGifs = async () => {
      const { data, error } = await supabase.storage
        .from('jhanvoo-gifs')
        .list();

      if (!error && data) {
        const gifUrls = data.map(file => 
          supabase.storage.from('jhanvoo-gifs').getPublicUrl(file.name).data.publicUrl
        );
        setHyperemoteGifs(gifUrls);
      }
    };

    fetchGifs();
  }, []);

  // Typing effect for text messages
  useEffect(() => {
    if (donation?.message && isVisible && !donation.is_hyperemote) {
      let currentIndex = 0;
      setDisplayedText("");
      
      const typingInterval = setInterval(() => {
        if (currentIndex <= donation.message!.length) {
          setDisplayedText(donation.message!.substring(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
        }
      }, 50);

      return () => clearInterval(typingInterval);
    }
  }, [donation, isVisible]);

  // Hyperemote rain effect
  useEffect(() => {
    if (donation?.is_hyperemote && isVisible && hyperemoteGifs.length > 0) {
      setShowRainEffect(true);
      const timer = setTimeout(() => setShowRainEffect(false), 8000);
      return () => clearTimeout(timer);
    } else {
      setShowRainEffect(false);
    }
  }, [donation, isVisible, hyperemoteGifs]);

  if (!isVisible || !donation) return null;

  return (
    <>
      {/* Hyperemote Rain Effect */}
      {showRainEffect && hyperemoteGifs.length > 0 && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {[...Array(15)].map((_, index) => {
            const gifUrl = hyperemoteGifs[index % hyperemoteGifs.length];
            const animationClass = ['floatUp', 'floatUpLeft', 'floatUpRight', 'spiralUp'][index % 4];
            const delay = (index * 0.3).toFixed(1);
            const left = (5 + (index * 7) % 90).toFixed(0);
            
            return (
              <div
                key={`rain-${index}`}
                className={`absolute ${animationClass}`}
                style={{
                  left: `${left}%`,
                  animationDelay: `${delay}s`,
                  bottom: '-120px',
                }}
              >
                <img 
                  src={gifUrl} 
                  alt="Hyperemote" 
                  className="w-24 h-24 object-contain opacity-90"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Regular Alert Box */}
      {!donation.is_hyperemote && (
        <div className="fixed bottom-[10%] left-1/2 -translate-x-1/2 z-50 max-w-3xl w-full px-4">
          <div className="bg-gradient-to-r from-indigo-600/95 to-purple-600/95 backdrop-blur-md px-8 py-4 rounded-xl shadow-2xl border border-indigo-400/50">
            <div className="flex items-center gap-3 text-white">
              <Sparkles className="w-6 h-6 text-yellow-300 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[1.2rem] font-bold leading-tight">
                  {donation.name} donated ₹{donation.amount}
                  {donation.voice_message_url && (
                    <span className="ml-2 text-yellow-300">🎤 Voice Message</span>
                  )}
                </p>
                {donation.message && (
                  <p className="text-base mt-1 break-words">{displayedText}</p>
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