import { useEffect, useState } from "react";
import { getCurrencySymbol } from "@/constants/currencies";

interface Donation {
  id: string;
  name: string;
  amount: number;
  currency?: string;
  message?: string;
  voice_message_url?: string;
  hypersound_url?: string;
  is_hyperemote?: boolean;
}

interface BongFlickAlertDisplayProps {
  donation: Donation;
  scale?: number;
}

export const BongFlickAlertDisplay = ({ donation, scale = 1.0 }: BongFlickAlertDisplayProps) => {
  const [displayedText, setDisplayedText] = useState("");

  const isVoiceMessage = !!donation.voice_message_url;
  const isHypersound = !!donation.hypersound_url;
  const currencySymbol = getCurrencySymbol(donation.currency || 'INR');

  useEffect(() => {
    if (donation.message && !isVoiceMessage && !isHypersound) {
      let currentIndex = 0;
      setDisplayedText("");
      const interval = setInterval(() => {
        if (currentIndex <= donation.message!.length) {
          setDisplayedText(donation.message!.substring(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
        }
      }, 50);
      return () => clearInterval(interval);
    } else {
      setDisplayedText(donation.message || "");
    }
  }, [donation.message, isVoiceMessage, isHypersound]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div 
        className="absolute bottom-[10%] left-1/2 text-white text-center flex flex-col items-center gap-1.5 px-8 py-4 rounded-xl"
        style={{
          background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.7), rgba(168, 85, 247, 0.7))',
          boxShadow: '0 0 25px rgba(139, 92, 246, 0.4)',
          letterSpacing: '0.4px',
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: 'bottom center',
        }}
      >
        <div className="text-[1.2rem]">
          <span className="font-bold">{donation.name}</span> donated{' '}
          <span className="font-bold">{currencySymbol}{donation.amount}</span>
        </div>

        {isHypersound && (
          <div className="inline-flex items-center gap-2 text-sm">
            <span>🔊 HyperSound</span>
          </div>
        )}

        {isVoiceMessage && (
          <div className="inline-flex items-center gap-2 text-sm">
            <span>🎵 Voice Message</span>
          </div>
        )}

        {donation.message && !isVoiceMessage && !isHypersound && (
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
