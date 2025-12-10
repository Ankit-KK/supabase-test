import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, Music } from 'lucide-react';
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

interface ClumsyGodAlertDisplayProps {
  donation: Donation | null;
  isVisible: boolean;
  scale?: number;
}

export const ClumsyGodAlertDisplay: React.FC<ClumsyGodAlertDisplayProps> = ({
  donation,
  isVisible,
  scale = 1.0
}) => {
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const donationIdRef = useRef<string | null>(null);

  // Typing effect for messages
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

    // For voice messages or HyperSounds, show full text immediately
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
  }, [donation?.id, donation?.message, isVisible]);

  if (!donation || !isVisible) {
    return null;
  }

  const currencySymbol = getCurrencySymbol(donation.currency || 'INR');
  const isHyperSound = !!donation.hypersound_url;
  const isVoiceMessage = !!donation.voice_message_url;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{ transform: `scale(${scale})` }}
    >
      {/* Regular Alert Box (for all donation types) */}
      <div 
        className="relative p-6 rounded-2xl max-w-lg mx-4 animate-fade-in"
        style={{
          background: `linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(124, 58, 237, 0.95) 100%)`,
          boxShadow: `0 0 60px rgba(139, 92, 246, 0.5), 0 0 120px rgba(124, 58, 237, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)`,
          border: '2px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        {/* Glow effect */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-50 blur-xl -z-10"
          style={{ background: 'rgba(139, 92, 246, 0.4)' }}
        />
        
        {/* Header with icon and amount */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-full"
              style={{ background: 'rgba(255, 255, 255, 0.2)' }}
            >
              {isHyperSound ? (
                <Music className="h-6 w-6 text-white" />
              ) : (
                <Gamepad2 className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-white font-bold text-xl drop-shadow-lg">
                {donation.name}
              </h3>
              <p className="text-white/80 text-sm">
                {isHyperSound ? 'sent a HyperSound!' : isVoiceMessage ? 'sent a Voice Message!' : 'sent a message'}
              </p>
            </div>
          </div>
          <div 
            className="px-4 py-2 rounded-full font-bold text-xl text-white"
            style={{ background: 'rgba(255, 255, 255, 0.2)' }}
          >
            {currencySymbol}{donation.amount}
          </div>
        </div>

        {/* Message content */}
        <div 
          className="p-4 rounded-xl"
          style={{ background: 'rgba(0, 0, 0, 0.2)' }}
        >
          {isVoiceMessage ? (
            <div className="flex items-center gap-3 text-white">
              <Music className="h-5 w-5 animate-pulse" />
              <span className="font-medium">🎵 Playing voice message...</span>
            </div>
          ) : isHyperSound ? (
            <div className="flex items-center gap-3 text-white">
              <Music className="h-5 w-5 animate-pulse" />
              <span className="font-medium">🔊 Playing sound...</span>
            </div>
          ) : (
            <p className="text-white text-lg leading-relaxed">
              {displayedMessage}
              {isTyping && <span className="animate-pulse">|</span>}
            </p>
          )}
        </div>

        {/* ClumsyGod branding */}
        <div className="mt-4 text-center">
          <span className="text-white/60 text-xs font-medium">
            ClumsyGod × HyperChat
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClumsyGodAlertDisplay;
