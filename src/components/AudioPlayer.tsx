import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { generateTTS, cleanupTTSCache } from '@/utils/generateTTS';
import { toast } from 'sonner';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message?: string;
  voice_message_url?: string;
  created_at: string;
}

interface AudioPlayerProps {
  donation: Donation | null;
  onNext?: () => void;
  autoPlay?: boolean;
  autoPlayEnabledAt?: number | null;
  onAutoPlayChange?: (enabled: boolean) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  donation,
  onNext,
  autoPlay = false,
  autoPlayEnabledAt,
  onAutoPlayChange
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [generatedTTSUrl, setGeneratedTTSUrl] = useState<string | null>(null);
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (onNext) {
        setTimeout(onNext, 1000); // Wait 1 second before next
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onNext]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Generate TTS for text-only donations
  useEffect(() => {
    if (!donation) return;

    // Reset TTS state
    setGeneratedTTSUrl(null);
    setIsGeneratingTTS(false);
    setIsPlaying(false);
    setCurrentTime(0);

    // If has voice message, use it
    if (donation.voice_message_url) {
      // Only autoplay if donation arrived after autoplay was enabled
      const donationTime = new Date(donation.created_at).getTime();
      if (autoPlay && autoPlayEnabledAt && donationTime >= autoPlayEnabledAt) {
        handlePlay();
      }
      return;
    }

    // If has text message but no voice, generate TTS
    if (donation.message) {
      setIsGeneratingTTS(true);
      generateTTS(donation.name, donation.amount, donation.message)
        .then(({ audioUrl, error }) => {
          setIsGeneratingTTS(false);
          if (audioUrl) {
            setGeneratedTTSUrl(audioUrl);
            // Only autoplay if donation arrived after autoplay was enabled
            const donationTime = new Date(donation.created_at).getTime();
            if (autoPlay && autoPlayEnabledAt && donationTime >= autoPlayEnabledAt) {
              setTimeout(() => handlePlay(), 100);
            }
          } else {
            toast.error('Failed to generate speech: ' + (error || 'Unknown error'));
          }
        });
    }
  }, [donation?.id]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (generatedTTSUrl) {
        URL.revokeObjectURL(generatedTTSUrl);
      }
    };
  }, [generatedTTSUrl]);

  const handlePlay = async () => {
    if (!audioRef.current) return;
    
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const handlePause = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const handleReplay = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    handlePlay();
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!donation) {
    return (
      <div className="bg-card rounded-lg p-6 text-center">
        <p className="text-muted-foreground">No message to play</p>
      </div>
    );
  }

  const audioUrl = donation.voice_message_url || generatedTTSUrl;

  if (isGeneratingTTS) {
    return (
      <div className="bg-card rounded-lg p-6 space-y-4">
        <div className="text-center">
          <h3 className="font-semibold text-lg">{donation.name}</h3>
          <p className="text-primary font-medium">₹{donation.amount}</p>
          {donation.message && (
            <p className="text-sm text-muted-foreground mt-1">{donation.message}</p>
          )}
        </div>
        <div className="flex items-center justify-center gap-2 text-muted-foreground py-8">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p>Generating speech...</p>
        </div>
      </div>
    );
  }

  if (!audioUrl) {
    return (
      <div className="bg-card rounded-lg p-6 space-y-4">
        <div className="text-center">
          <h3 className="font-semibold text-lg">{donation.name}</h3>
          <p className="text-primary font-medium">₹{donation.amount}</p>
          {donation.message && (
            <p className="text-sm text-muted-foreground mt-1">{donation.message}</p>
          )}
        </div>
        <div className="text-center text-muted-foreground py-4">
          <p>No audio available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6 space-y-4">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
      />
      
      {/* Donation Info */}
      <div className="text-center">
        <h3 className="font-semibold text-lg">{donation.name}</h3>
        <p className="text-primary font-medium">₹{donation.amount}</p>
        {donation.message && (
          <p className="text-sm text-muted-foreground mt-1">{donation.message}</p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReplay}
          className="w-10 h-10 p-0"
        >
          <SkipBack className="w-4 h-4" />
        </Button>
        
        <Button
          variant="default"
          size="sm"
          onClick={isPlaying ? handlePause : handlePlay}
          className="w-12 h-12 p-0 rounded-full"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </Button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMuted(!isMuted)}
          className="w-8 h-8 p-0"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>
        <Slider
          value={[isMuted ? 0 : volume * 100]}
          max={100}
          step={1}
          onValueChange={(value) => setVolume(value[0] / 100)}
          className="flex-1"
        />
      </div>

      {/* Auto-play Toggle */}
      {onAutoPlayChange && (
        <div className="flex items-center justify-center gap-2">
          <Switch
            id="autoplay"
            checked={autoPlay}
            onCheckedChange={onAutoPlayChange}
          />
          <Label htmlFor="autoplay" className="text-sm">
            Auto-play new messages
          </Label>
        </div>
      )}
    </div>
  );
};