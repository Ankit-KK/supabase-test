import { useEffect, useState, useRef } from "react";
import { getCurrencySymbol } from "@/constants/currencies";

interface Donation {
  id: string;
  name: string;
  amount: number;
  currency?: string;
  message?: string;
  voice_message_url?: string;
  hypersound_url?: string;
  is_hyperemote: boolean;
  created_at: string;
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
  scale = 1.0
}: JhanvooAlertDisplayProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const donationIdRef = useRef<string | null>(null);

  // Typing effect for text messages
  useEffect(() => {
    // Skip typing effect for HyperSounds and voice messages - show full message immediately
    if (!donation?.message || donation.hypersound_url || donation.voice_message_url) {
      setDisplayedText(donation?.message || "");
      setIsTyping(false);
      return;
    }

    if (donation && isVisible && donation.message) {
      // Check if this is a new donation
      if (donationIdRef.current !== donation.id) {
        donationIdRef.current = donation.id;

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

  if (!isVisible || !donation) return null;

  const currencySymbol = getCurrencySymbol(donation.currency || "INR");

  // Standard bottom-positioned horizontal bar alert
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div 
        className="absolute bottom-[10%] left-1/2 text-white text-center flex flex-col items-center gap-1.5 px-8 py-4 rounded-xl opacity-100 transition-opacity duration-600"
        style={{
          background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.6), rgba(129, 140, 248, 0.6))',
          boxShadow: '0 0 25px rgba(99, 102, 241, 0.4)',
          letterSpacing: '0.4px',
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: 'bottom center',
        }}
      >
        {/* Name and Amount */}
        <div className="text-[1.2rem]">
          <span className="font-bold">{donation.name}</span> donated{' '}
          <span className="font-bold">{currencySymbol}{donation.amount}</span>
        </div>

        {/* HyperSound Indicator */}
        {donation.hypersound_url && (
          <div className="inline-flex items-center gap-2 text-sm">
            <span>🔊 HyperSound</span>
          </div>
        )}

        {/* Voice Message Indicator */}
        {donation.voice_message_url && !donation.hypersound_url && (
          <div className="inline-flex items-center gap-2 text-sm">
            <span>🎵 Voice Message</span>
          </div>
        )}

        {/* Message with Typing Effect (only for text donations) */}
        {donation.message && !donation.voice_message_url && !donation.hypersound_url && (
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
