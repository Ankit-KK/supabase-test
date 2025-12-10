import React, { useState, useEffect } from 'react';
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

interface LooteriyaGamingAlertDisplayProps {
  donation: Donation | null;
  isVisible: boolean;
  scale?: number;
}

export const LooteriyaGamingAlertDisplay: React.FC<LooteriyaGamingAlertDisplayProps> = ({
  donation,
  isVisible,
  scale = 1.0
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Typing effect for text messages only
  useEffect(() => {
    if (!donation?.message || donation.voice_message_url || donation.hypersound_url) {
      setDisplayedText(donation?.message || '');
      setIsTyping(false);
      return;
    }

    setDisplayedText('');
    setIsTyping(true);

    const message = donation.message;
    let currentIndex = 0;

    const typingInterval = setInterval(() => {
      if (currentIndex < message.length) {
        setDisplayedText(message.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, [donation?.id, donation?.message, donation?.voice_message_url, donation?.hypersound_url]);

  if (!donation || !isVisible) {
    return null;
  }

  const currencySymbol = getCurrencySymbol(donation.currency || 'INR');
  const isVoiceMessage = !!donation.voice_message_url;
  const isHypersound = !!donation.hypersound_url;

  return (
    <div className="fixed inset-0 flex items-end justify-center pb-[10%] pointer-events-none">
      <div
        className="px-8 py-4 rounded-lg animate-fade-in"
        style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.95) 0%, rgba(234, 88, 12, 0.95) 100%)',
          boxShadow: '0 8px 32px rgba(245, 158, 11, 0.4)',
          maxWidth: '80%',
          transform: `scale(${scale})`,
          transformOrigin: 'bottom center',
        }}
      >
        <div className="text-center">
          <p className="text-2xl font-bold text-white mb-2">
            {donation.name} donated {currencySymbol}{donation.amount}
            {isHypersound && ' 🔊 HyperSound'}
            {isVoiceMessage && ' 🎵 Voice Message'}
          </p>
          {donation.message && (
            <p className="text-xl text-white/90">
              {displayedText}
              {isTyping && <span className="animate-pulse">|</span>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
