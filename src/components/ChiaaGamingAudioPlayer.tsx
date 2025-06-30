import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  created_at: string;
  payment_status: string;
  voice_url?: string;
  custom_sound_name?: string;
  custom_sound_url?: string;
}

const ChiaaGamingAudioPlayer = () => {
  const { obsId } = useParams();
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [audioQueue, setAudioQueue] = useState<string[]>([]);
  const [volume, setVolume] = useState<number[]>([70]); // Default volume at 70%
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Update audio volume when slider changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
    }
  }, [volume]);

  // Validate OBS token
  useEffect(() => {
    const validateToken = async () => {
      if (!obsId) {
        setTokenValid(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('validate_obs_token', {
          p_token: obsId,
          p_admin_type: 'chiaa_gaming'
        });

        if (error || !data) {
          console.error("Invalid OBS token:", error);
          setTokenValid(false);
          return;
        }

        setTokenValid(true);
      } catch (error) {
        console.error("Error validating token:", error);
        setTokenValid(false);
      }
    };

    validateToken();
  }, [obsId]);

  // Play audio from queue
  const playNextAudio = () => {
    if (audioQueue.length > 0 && !isAudioActive) {
      const nextAudio = audioQueue[0];
      setAudioQueue(prev => prev.slice(1));
      setCurrentAudio(nextAudio);
      setIsAudioActive(true);

      if (audioRef.current) {
        audioRef.current.src = nextAudio;
        audioRef.current.play().catch(error => {
          console.error("Error playing audio:", error);
          setIsAudioActive(false);
          setCurrentAudio(null);
          // Try next audio in queue
          setTimeout(playNextAudio, 500);
        });
      }
    }
  };

  // Handle audio end
  const handleAudioEnd = () => {
    setIsAudioActive(false);
    setCurrentAudio(null);
    // Play next audio in queue after a short delay
    setTimeout(playNextAudio, 1000);
  };

  // Add audio to queue
  const queueAudio = (audioUrl: string) => {
    console.log('Queueing audio:', audioUrl);
    setAudioQueue(prev => [...prev, audioUrl]);
  };

  useEffect(() => {
    if (!tokenValid) return;

    // Set up real-time subscription for audio donations with 1 minute delay
    const channel = supabase
      .channel(`chiaa-gaming-audio-player-${obsId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chiaa_gaming_donations',
          filter: 'payment_status=eq.success'
        },
        (payload) => {
          const newDonation = payload.new as Donation;
          console.log('New successful donation received in audio player with 1 minute delay:', newDonation);
          
          // Check if donation has audio content
          const hasVoice = newDonation.voice_url;
          const hasCustomSound = newDonation.custom_sound_url;
          
          if (hasVoice || hasCustomSound) {
            // Queue audio with 1 minute delay
            setTimeout(() => {
              console.log('Playing delayed audio for donation:', newDonation.id);
              
              if (hasVoice && newDonation.voice_url) {
                queueAudio(newDonation.voice_url);
              }
              
              if (hasCustomSound && newDonation.custom_sound_url) {
                queueAudio(newDonation.custom_sound_url);
              }
            }, 60000); // 1 minute delay
          }
        }
      )
      .subscribe();

    console.log('Chiaa Gaming audio player real-time subscription set up with 1 minute delay');

    return () => {
      supabase.removeChannel(channel);
    };
  }, [obsId, tokenValid]);

  // Auto-play next audio when queue changes
  useEffect(() => {
    playNextAudio();
  }, [audioQueue, isAudioActive]);

  // Show loading or error state
  if (tokenValid === null) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <Volume2 className="w-8 h-8 mx-auto mb-2 animate-pulse" />
          <div className="text-lg">Validating audio player access...</div>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-red-400">
        <div className="text-center">
          <VolumeX className="w-8 h-8 mx-auto mb-2" />
          <div className="text-lg">Invalid or expired audio player token</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnd}
        onError={handleAudioEnd}
        className="hidden"
      />
      
      {/* Status indicator */}
      <div className="text-center text-white max-w-md w-full px-6">
        <div className="mb-4">
          {isAudioActive ? (
            <Volume2 className="w-12 h-12 mx-auto text-green-400 animate-pulse" />
          ) : (
            <Volume2 className="w-12 h-12 mx-auto text-blue-400" />
          )}
        </div>
        
        <div className="text-lg font-semibold mb-2">
          Chiaa Gaming Audio Player
        </div>
        
        <div className="text-sm text-gray-300 mb-4">
          {isAudioActive ? "Playing audio..." : "Ready for audio"}
        </div>
        
        {/* Volume Control */}
        <div className="mb-4 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <VolumeX className="w-4 h-4 text-gray-400" />
            <div className="flex-1">
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>
            <Volume2 className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-xs text-gray-400 text-center">
            Volume: {volume[0]}%
          </div>
        </div>
        
        {audioQueue.length > 0 && (
          <div className="text-xs text-yellow-400 mb-2">
            {audioQueue.length} audio(s) in queue
          </div>
        )}
        
        {currentAudio && (
          <div className="text-xs text-green-400 mb-4">
            Playing: {currentAudio.substring(currentAudio.lastIndexOf('/') + 1, currentAudio.lastIndexOf('?') || currentAudio.length)}
          </div>
        )}
        
        <div className="text-xs text-gray-400">
          Keep this tab open in background for reliable audio playback
        </div>
      </div>
    </div>
  );
};

export default ChiaaGamingAudioPlayer;
