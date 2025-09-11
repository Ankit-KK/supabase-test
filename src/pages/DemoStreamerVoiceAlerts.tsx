import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Volume2, VolumeX } from "lucide-react";

interface VoiceDonation {
  id: string;
  name: string;
  amount: number;
  message: string;
  voice_message_url: string;
  tts_audio_url: string;
  payment_status: string;
  moderation_status: string;
  created_at: string;
}

export default function DemoStreamerVoiceAlerts() {
  const { token } = useParams<{ token: string }>();
  const [audioQueue, setAudioQueue] = useState<VoiceDonation[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<VoiceDonation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [streamerInfo, setStreamerInfo] = useState<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!token) return;

    // Validate token and get streamer info
    const validateToken = async () => {
      try {
        const { data } = await supabase
          .rpc('validate_obs_token_secure', { token_to_check: token });

        if (data && data.length > 0 && data[0].is_valid) {
          setStreamerInfo(data[0]);
          setupRealtimeSubscription(data[0].streamer_id);
        } else {
          console.error('Invalid OBS token');
        }
      } catch (error) {
        console.error('Error validating token:', error);
      }
    };

    validateToken();
  }, [token]);

  const setupRealtimeSubscription = (streamerId: string) => {
    const channel = supabase
      .channel('demostreamer_voice_alerts_realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'demostreamer_donations',
          filter: `streamer_id=eq.${streamerId}`
        },
        (payload) => {
          const donation = payload.new as VoiceDonation;
          
          // Queue voice messages for approved donations
          if (donation.payment_status === 'success' && 
              (donation.moderation_status === 'approved' || donation.moderation_status === 'auto_approved') &&
              (donation.voice_message_url || donation.tts_audio_url)) {
            queueVoiceMessage(donation);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const queueVoiceMessage = (donation: VoiceDonation) => {
    setAudioQueue(prev => [...prev, donation]);
  };

  useEffect(() => {
    // Process audio queue
    if (audioQueue.length > 0 && !isPlaying) {
      playNextInQueue();
    }
  }, [audioQueue, isPlaying]);

  const playNextInQueue = async () => {
    if (audioQueue.length === 0 || isPlaying) return;

    const nextDonation = audioQueue[0];
    setCurrentlyPlaying(nextDonation);
    setIsPlaying(true);

    // Prefer TTS audio over voice message
    const audioUrl = nextDonation.tts_audio_url || nextDonation.voice_message_url;
    
    if (audioRef.current && audioUrl) {
      try {
        audioRef.current.src = audioUrl;
        await audioRef.current.play();
      } catch (error) {
        console.error('Error playing audio:', error);
        handleAudioEnd();
      }
    } else {
      handleAudioEnd();
    }
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
    setCurrentlyPlaying(null);
    setAudioQueue(prev => prev.slice(1));
  };

  const handleAudioError = () => {
    console.error('Audio playback error');
    handleAudioEnd();
  };

  if (!streamerInfo) {
    return (
      <div className="w-full h-screen bg-transparent flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading Demo Streamer Voice Alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-transparent relative">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnd}
        onError={handleAudioError}
        preload="none"
      />

      {/* Voice Alert Display */}
      {currentlyPlaying && (
        <div className="absolute top-8 right-8 bg-gradient-to-r from-purple-600/90 to-indigo-600/90 text-white p-4 rounded-xl shadow-lg backdrop-blur-sm border border-white/20 min-w-[300px] animate-slideInRight">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              {isPlaying ? (
                <Volume2 className="w-5 h-5 text-green-300 animate-pulse" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-300" />
              )}
            </div>
            <div>
              <p className="font-semibold text-sm">🎵 Voice Message</p>
              <p className="text-xs text-white/80">
                {currentlyPlaying.name} • ₹{currentlyPlaying.amount}
              </p>
            </div>
          </div>
          
          {currentlyPlaying.message && (
            <div className="bg-white/10 rounded-lg p-2 text-xs italic">
              "{currentlyPlaying.message}"
            </div>
          )}

          {/* Audio progress indicator */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <span className="text-xs text-white/80">
              {isPlaying ? 'Playing...' : 'Loading...'}
            </span>
          </div>
        </div>
      )}

      {/* Queue indicator */}
      {audioQueue.length > 1 && (
        <div className="absolute top-32 right-8 bg-black/50 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm">
          {audioQueue.length - 1} more in queue
        </div>
      )}

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}