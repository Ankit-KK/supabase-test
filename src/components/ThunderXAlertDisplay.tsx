import React, { useState, useEffect, useRef } from 'react';
import { Music } from 'lucide-react';
import { getCurrencySymbol } from '@/constants/currencies';

interface Donation {
  id: string;
  name: string;
  amount: number;
  currency?: string;
  message: string;
  voice_message_url?: string;
  hypersound_url?: string;
  created_at: string;
  is_hyperemote: boolean;
}

interface ThunderXAlertDisplayProps {
  donation: Donation | null;
  isVisible: boolean;
  streamerBrandColor?: string;
  streamerName?: string;
  scale?: number;
}

export const ThunderXAlertDisplay: React.FC<ThunderXAlertDisplayProps> = ({
  donation,
  isVisible,
  streamerBrandColor = '#10b981',
  streamerName = 'THUNDERX',
  scale = 1.0
}) => {
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const donationIdRef = useRef<string | null>(null);

  // Typing effect for text messages
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setDisplayedMessage('');
    setIsTyping(false);

    if (!donation?.message || !isVisible) {
      return;
    }

    if (donationIdRef.current !== donation.id) {
      donationIdRef.current = donation.id;
    }

    // Voice messages or HyperSounds show full text immediately
    if (donation.voice_message_url || donation.hypersound_url) {
      setDisplayedMessage(donation.message);
      return;
    }

    // Text messages get typing animation
    setIsTyping(true);
    let index = 0;
    const message = donation.message;
    
    intervalRef.current = setInterval(() => {
      if (donationIdRef.current !== donation.id) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      if (index < message.length) {
        setDisplayedMessage(message.substring(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, 50);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [donation?.id, donation?.message, donation?.voice_message_url, donation?.hypersound_url, isVisible]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  if (!donation || !isVisible) {
    return null;
  }

  const currencySymbol = getCurrencySymbol(donation.currency || 'INR');
  const isHyperSound = !!donation.hypersound_url;
  const isVoiceMessage = !!donation.voice_message_url;

  // Standard bottom-positioned horizontal bar alert (no hyperemote rain effect)
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div 
        className="absolute bottom-[10%] left-1/2 text-white text-center flex flex-col items-center gap-1.5 px-8 py-4 rounded-xl animate-fade-in"
        style={{
          background: `linear-gradient(90deg, rgba(16, 185, 129, 0.6), rgba(5, 150, 105, 0.6))`,
          boxShadow: `0 0 25px rgba(16, 185, 129, 0.4)`,
          transform: `translateX(-50%) scale(${scale})`,
        }}
      >
        <div className="text-[1.2rem]">
          <span className="font-bold">{donation.name}</span> donated{' '}
          <span className="font-bold">{currencySymbol}{donation.amount}</span>
        </div>

        {/* Voice Message Indicator */}
        {isVoiceMessage && (
          <div className="inline-flex items-center gap-2 text-sm">
            <Music className="w-4 h-4" />
            <span>🎵 Voice Message</span>
          </div>
        )}

        {/* HyperSound Indicator */}
        {isHyperSound && (
          <div className="inline-flex items-center gap-2 text-sm">
            <Music className="w-4 h-4" />
            <span>🔊 HyperSound</span>
          </div>
        )}

        {/* Message with Typing Effect */}
        {(displayedMessage || isTyping) && !isVoiceMessage && !isHyperSound && (
          <div className="text-base font-normal min-h-[1.2em]">
            "{displayedMessage}"
            {isTyping && <span className="animate-pulse ml-1">|</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ThunderXAlertDisplay;