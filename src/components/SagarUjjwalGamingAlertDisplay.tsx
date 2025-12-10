import { useEffect, useState } from 'react';
import { Music, Volume2 } from 'lucide-react';

interface Donation {
  name: string;
  amount: number;
  currency?: string;
  message?: string;
  voice_message_url?: string;
  hypersound_url?: string;
  is_hyperemote?: boolean;
}

interface SagarUjjwalGamingAlertDisplayProps {
  donation: Donation | null;
  isVisible: boolean;
  streamerBrandColor?: string;
  streamerName?: string;
  scale?: number;
}

const getCurrencySymbol = (currency: string = 'INR'): string => {
  const symbols: Record<string, string> = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'AED': 'د.إ',
    'AUD': 'A$',
  };
  return symbols[currency] || currency;
};

export const SagarUjjwalGamingAlertDisplay = ({ 
  donation, 
  isVisible,
  streamerBrandColor = "#ef4444",
  streamerName = "SAGAR UJJWAL GAMING",
  scale = 1.0
}: SagarUjjwalGamingAlertDisplayProps) => {
  const [displayedMessage, setDisplayedMessage] = useState('');

  // Typing animation for text messages
  useEffect(() => {
    if (!donation?.message || donation.voice_message_url || donation.hypersound_url) {
      setDisplayedMessage(donation?.message || '');
      return;
    }

    let currentIndex = 0;
    const message = donation.message;
    setDisplayedMessage('');

    const typingInterval = setInterval(() => {
      if (currentIndex < message.length) {
        setDisplayedMessage(message.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, [donation]);

  if (!isVisible || !donation) {
    return null;
  }

  const currencySymbol = getCurrencySymbol(donation.currency);

  // Standard alert box for all donation types
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div 
        className={`
          absolute bottom-[10%] left-1/2
          text-white text-center
          flex flex-col items-center gap-1.5
          px-8 py-4 rounded-xl
          ${isVisible ? 'opacity-100' : 'opacity-0'}
          transition-opacity duration-600
        `}
        style={{
          background: `linear-gradient(90deg, ${streamerBrandColor}99, ${streamerBrandColor}66)`,
          boxShadow: `0 0 25px ${streamerBrandColor}66`,
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
            <Volume2 className="w-4 h-4" />
            <span>🔊 HyperSound</span>
          </div>
        )}

        {/* Voice Message Indicator */}
        {donation.voice_message_url && !donation.hypersound_url && (
          <div className="inline-flex items-center gap-2 text-sm">
            <Music className="w-4 h-4" />
            <span>🎵 Voice Message</span>
          </div>
        )}

        {/* Message with Typing Effect */}
        {displayedMessage && !donation.hypersound_url && (
          <div 
            className="text-base font-normal min-h-[1.2em]"
            style={{ opacity: 0.9, color: '#f9f9f9' }}
          >
            "{displayedMessage}"
            {displayedMessage !== donation.message && (
              <span className="animate-pulse ml-1">|</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};