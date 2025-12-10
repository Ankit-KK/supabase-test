import React, { useState, useEffect, useRef } from 'react';
import { Music, Volume2 } from 'lucide-react';
import { getCurrencySymbol } from '@/constants/currencies';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  voice_message_url?: string;
  hypersound_url?: string;
  created_at: string;
  is_hyperemote: boolean;
  currency?: string;
}

interface VIPBhaiAlertDisplayProps {
  donation: Donation | null;
  isVisible: boolean;
  streamerBrandColor?: string;
  streamerName?: string;
  scale?: number;
}

export const VIPBhaiAlertDisplay: React.FC<VIPBhaiAlertDisplayProps> = ({
  donation,
  isVisible,
  streamerBrandColor = '#f59e0b',
  streamerName = 'VIP BHAI',
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

    // Voice messages and HyperSounds show full text immediately
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

  const currency = donation.currency || 'INR';
  const currencySymbol = getCurrencySymbol(currency);

  // Standard alert display
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div 
        className="absolute bottom-[10%] left-1/2 text-white text-center flex flex-col items-center gap-1.5 px-8 py-4 rounded-xl"
        style={{
          background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.6), rgba(234, 88, 12, 0.6))',
          boxShadow: '0 0 25px rgba(245, 158, 11, 0.4)',
          letterSpacing: '0.4px',
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: 'bottom center',
        }}
      >
        <div className="text-[1.2rem]">
          <span className="font-bold">{donation.name}</span> donated{' '}
          <span className="font-bold">{currencySymbol}{donation.amount}</span>
        </div>

        {donation.hypersound_url && (
          <div className="inline-flex items-center gap-2 text-sm">
            <Volume2 className="w-4 h-4" />
            <span>🔊 HyperSound</span>
          </div>
        )}

        {donation.voice_message_url && !donation.hypersound_url && (
          <div className="inline-flex items-center gap-2 text-sm">
            <Music className="w-4 h-4" />
            <span>🎵 Voice Message</span>
          </div>
        )}

        {(donation.message || isTyping) && !donation.hypersound_url && (
          <div className="text-base font-normal min-h-[1.2em]" style={{ opacity: 0.9, color: '#f9f9f9' }}>
            "{donation.voice_message_url ? donation.message : displayedMessage}"
            {isTyping && <span className="animate-pulse ml-1">|</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default VIPBhaiAlertDisplay;