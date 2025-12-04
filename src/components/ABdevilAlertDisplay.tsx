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
  scale?: number;
}

export const ABdevilAlertDisplay = ({
  donation,
  isVisible = true,
  scale = 1.0,
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
                transform: translate(15vw, -60vh) rotate(720deg) scale(1);
              }
              90% {
                opacity: 1;
              }
              100% {
                transform: translate(-15vw, -120vh) rotate(1080deg) scale(0.5);
                opacity: 0;
              }
            }
          `}
        </style>
        {Array.from({ length: 20 }).map((_, index) => {
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
                animation: `${randomAnimation} ${8 + Math.random() * 4}s ease-in-out ${randomDelay}s forwards`,
                bottom: '-150px',
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
        {donation.voice_message_url && (
          <div className="inline-flex items-center gap-2 text-sm">
            <span>🎵 Voice Message</span>
          </div>
        )}

        {/* Message with Typing Effect */}
        {donation.message && !donation.voice_message_url && (
          <div 
            className="text-base font-normal min-h-[1.2em]"
            style={{ opacity: 0.9, color: '#f9f9f9' }}
          >
            "{displayedText}"
            {isTyping && <span className="animate-pulse ml-1">|</span>}
          </div>
        )}
      </div>
    </div>
  );
};