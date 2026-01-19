import React, { useState, useEffect, useRef } from 'react';
import { Music } from 'lucide-react';
import { getCurrencySymbol } from '@/constants/currencies';

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

interface UnifiedAlertDisplayProps {
  donation: Donation | null;
  isVisible: boolean;
  brandColor: string;
  scale?: number;
}

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(59, 130, 246, ${alpha})`; // Fallback blue
  return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
};

// Helper function to create darker variant of hex color
const hexToDarker = (hex: string, factor: number = 0.7): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = Math.floor(parseInt(result[1], 16) * factor);
  const g = Math.floor(parseInt(result[2], 16) * factor);
  const b = Math.floor(parseInt(result[3], 16) * factor);
  return `rgb(${r}, ${g}, ${b})`;
};

export const UnifiedAlertDisplay: React.FC<UnifiedAlertDisplayProps> = ({
  donation,
  isVisible,
  brandColor,
  scale = 1.0
}) => {
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const donationIdRef = useRef<string | null>(null);

  // Typing effect for text messages only
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

    // For voice/hypersound, show full text immediately (no typing)
    if (donation.voice_message_url || donation.hypersound_url) {
      setDisplayedMessage(donation.message);
      return;
    }

    // Start typing effect for text messages
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

  // Cleanup on unmount
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
  const isVoiceMessage = !!donation.voice_message_url;
  const isHypersound = !!donation.hypersound_url;

  // Dynamic styling based on brand color
  const gradientBg = `linear-gradient(135deg, ${hexToRgba(brandColor, 0.95)} 0%, ${hexToRgba(hexToDarker(brandColor), 0.95)} 100%)`;
  const boxShadow = `0 8px 32px ${hexToRgba(brandColor, 0.4)}`;

  return (
    <div className="fixed inset-0 flex items-end justify-center pb-[10%] pointer-events-none">
      <div
        className="px-8 py-4 rounded-lg animate-fade-in"
        style={{
          background: gradientBg,
          boxShadow: boxShadow,
          maxWidth: '80%',
          transform: `scale(${scale})`,
          transformOrigin: 'bottom center',
        }}
      >
        <div className="text-center">
          <p className="text-2xl font-bold text-white mb-2">
            {donation.name} donated {currencySymbol}{donation.amount}
            {isHypersound && ' 🔊 HyperSound'}
            {isVoiceMessage && !isHypersound && (
              <span className="inline-flex items-center gap-1 ml-2">
                <Music className="w-5 h-5" />
                Voice Message
              </span>
            )}
          </p>
          {donation.message && (
            <p className="text-xl text-white/90">
              {displayedMessage}
              {isTyping && <span className="animate-pulse">|</span>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedAlertDisplay;
