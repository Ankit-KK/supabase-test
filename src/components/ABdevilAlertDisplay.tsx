import { useState, useEffect } from "react";
import { Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Donation {
  id?: string;
  name: string;
  amount: number;
  message?: string;
  voice_message_url?: string;
  is_hyperemote?: boolean;
  created_at?: string;
}

interface ABdevilAlertDisplayProps {
  donation: Donation | null;
  isVisible?: boolean;
}

export const ABdevilAlertDisplay = ({
  donation,
  isVisible = true,
}: ABdevilAlertDisplayProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [gifs, setGifs] = useState<string[]>([]);

  useEffect(() => {
    loadGifs();
  }, []);

  const loadGifs = async () => {
    try {
      const { data, error } = await supabase.storage
        .from("abdevil-gifs")
        .list();

      if (error) {
        console.error("Error loading GIFs:", error);
        return;
      }

      if (data) {
        const gifUrls = data
          .filter((file) => file.name.endsWith(".gif"))
          .map((file) => {
            const { data: urlData } = supabase.storage
              .from("abdevil-gifs")
              .getPublicUrl(file.name);
            return urlData.publicUrl;
          });
        setGifs(gifUrls);
      }
    } catch (error) {
      console.error("Error in loadGifs:", error);
    }
  };

  useEffect(() => {
    if (!donation?.message || donation.voice_message_url || donation.is_hyperemote) {
      setDisplayedText("");
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    setDisplayedText("");
    let currentIndex = 0;
    const typingSpeed = 50;

    const typingInterval = setInterval(() => {
      if (currentIndex < donation.message!.length) {
        setDisplayedText(donation.message!.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, typingSpeed);

    return () => clearInterval(typingInterval);
  }, [donation]);

  if (!isVisible || !donation) return null;

  // Hyperemote full-screen rain effect
  if (donation.is_hyperemote && gifs.length > 0) {
    const animations = ["floatUp", "floatUpLeft", "floatUpRight", "spiralUp"];
    
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <style>
          {`
            @keyframes floatUp {
              0% {
                transform: translateY(120vh) scale(0.8);
                opacity: 0;
              }
              10% {
                opacity: 1;
              }
              90% {
                opacity: 1;
              }
              100% {
                transform: translateY(-120vh) scale(1.2);
                opacity: 0;
              }
            }

            @keyframes floatUpLeft {
              0% {
                transform: translate(0, 120vh) rotate(0deg) scale(0.8);
                opacity: 0;
              }
              10% {
                opacity: 1;
              }
              90% {
                opacity: 1;
              }
              100% {
                transform: translate(-30vw, -120vh) rotate(-180deg) scale(1.2);
                opacity: 0;
              }
            }

            @keyframes floatUpRight {
              0% {
                transform: translate(0, 120vh) rotate(0deg) scale(0.8);
                opacity: 0;
              }
              10% {
                opacity: 1;
              }
              90% {
                opacity: 1;
              }
              100% {
                transform: translate(30vw, -120vh) rotate(180deg) scale(1.2);
                opacity: 0;
              }
            }

            @keyframes spiralUp {
              0% {
                transform: translate(0, 120vh) rotate(0deg) scale(0.8);
                opacity: 0;
              }
              10% {
                opacity: 1;
              }
              25% {
                transform: translate(10vw, 90vh) rotate(90deg) scale(0.9);
              }
              50% {
                transform: translate(-10vw, 60vh) rotate(180deg) scale(1);
              }
              75% {
                transform: translate(10vw, 30vh) rotate(270deg) scale(1.1);
              }
              90% {
                opacity: 1;
              }
              100% {
                transform: translate(0, -120vh) rotate(360deg) scale(1.2);
                opacity: 0;
              }
            }
          `}
        </style>
        {Array.from({ length: 30 }).map((_, index) => {
          const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
          const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
          const randomDelay = Math.random() * 3;
          const randomLeft = Math.random() * 100;
          const randomSize = 80 + Math.random() * 80;

          return (
            <img
              key={index}
              src={randomGif}
              alt="hyperemote"
              className="absolute"
              style={{
                left: `${randomLeft}%`,
                width: `${randomSize}px`,
                height: `${randomSize}px`,
                animation: `${randomAnimation} ${8 + Math.random() * 4}s ease-in-out ${randomDelay}s`,
                bottom: "-120vh",
              }}
            />
          );
        })}
      </div>
    );
  }

  // Regular donation alert
  return (
    <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top duration-500">
      <div className="bg-gradient-to-r from-orange-900/95 to-amber-800/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 border-2 border-orange-400 min-w-[400px] max-w-2xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-orange-600 p-3 rounded-full">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white">{donation.name}</h3>
            <p className="text-orange-200 text-lg">₹{donation.amount}</p>
          </div>
        </div>

        {donation.voice_message_url && (
          <div className="mt-4 p-4 bg-orange-500/20 rounded-lg border border-orange-400/30">
            <p className="text-orange-300 font-semibold flex items-center gap-2">
              🎤 Voice Message
            </p>
          </div>
        )}

        {donation.message && !donation.voice_message_url && (
          <div className="mt-4 p-4 bg-black/30 rounded-lg border border-orange-400/30">
            <p className="text-white text-lg leading-relaxed">
              {displayedText}
              {isTyping && <span className="animate-pulse">|</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};