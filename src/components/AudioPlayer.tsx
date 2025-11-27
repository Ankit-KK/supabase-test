import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { CustomSwitch } from '@/components/ui/custom-switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message?: string;
  voice_message_url?: string;
  created_at: string;
  streamer_id?: string;
  tts_audio_url?: string;
}

interface AudioPlayerProps {
  donation: Donation | null;
  onPlayComplete?: () => void;
  autoPlayTTS?: boolean;
  autoPlayVoice?: boolean;
  autoPlayTTSEnabledAt?: number | null;
  autoPlayVoiceEnabledAt?: number | null;
  onAutoPlayTTSChange?: (enabled: boolean) => void;
  onAutoPlayVoiceChange?: (enabled: boolean) => void;
  tableName: string;
}

const SILENT_AUDIO_URL = 'https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/voice-messages/test/looteriya_gaming_1764283000518_vrm0ib.webm';

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  donation,
  onPlayComplete,
  autoPlayTTS = false,
  autoPlayVoice = false,
  autoPlayTTSEnabledAt,
  autoPlayVoiceEnabledAt,
  onAutoPlayTTSChange,
  onAutoPlayVoiceChange,
  tableName
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(() => {
    return sessionStorage.getItem(`audio-unlocked-${tableName}`) === 'true';
  });

  // Reset completion guard when donation changes
  useEffect(() => {
    setHasCompleted(false);
  }, [donation?.id]);

  // Set up audio event listeners with multiple safety nets
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      const audio = audioRef.current;
      if (!audio) return;
      
      setCurrentTime(audio.currentTime);
      
      // Safety net: Manual completion check during timeupdate
      if (!hasCompleted && audio.duration > 0 && audio.currentTime >= audio.duration - 0.1) {
        if (onPlayComplete && isPlaying) {
          console.log('🏁 Audio reached end via timeupdate check');
          setHasCompleted(true);
          setIsPlaying(false);
          setCurrentTime(0);
          setTimeout(onPlayComplete, 500);
        }
      }
    };
    
    const updateDuration = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
      }
    };

    const handleEnded = () => {
      if (hasCompleted) return;
      
      console.log('🏁 Audio playback complete via ended event');
      setHasCompleted(true);
      setIsPlaying(false);
      setCurrentTime(0);
      
      if (onPlayComplete) {
        setTimeout(onPlayComplete, 500);
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
  }, [onPlayComplete, isPlaying, hasCompleted, donation?.id]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Determine if this donation should auto-play based on type
  const shouldAutoPlay = () => {
    if (!donation) return false;
    
    // Voice message - check autoPlayVoice setting
    if (donation.voice_message_url) {
      return autoPlayVoice;
    }
    
    // TTS message - check autoPlayTTS setting
    if (donation.tts_audio_url) {
      return autoPlayTTS;
    }
    
    return false;
  };

  // Process new donation
  useEffect(() => {
    if (!donation?.id) {
      return;
    }

    console.log('🎵 New donation in player:', donation.id);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHasCompleted(false);

    // Set audio source (priority: voice message > TTS audio)
    const audioUrl = donation.voice_message_url || donation.tts_audio_url;
    const audioType = donation.voice_message_url ? 'voice message' : 'TTS audio';
    
    if (audioUrl && audioRef.current) {
      console.log(`🔊 Loading ${audioType}:`, audioUrl);
      audioRef.current.src = audioUrl;
      audioRef.current.load();

      // Auto-play based on message type
      if (shouldAutoPlay()) {
        console.log(`▶️ Auto-playing ${audioType}`);
        setTimeout(() => handlePlay(), 100);
      }
    } else if (donation.message && !donation.voice_message_url) {
      // Only wait for TTS if it's a text message without voice recording
      console.log('⏳ Waiting for backend TTS generation...');
    }
  }, [donation?.id, donation?.voice_message_url, donation?.tts_audio_url, autoPlayTTS, autoPlayVoice]);

  // Auto-play when audio becomes unlocked (user clicks "Enable Audio")
  useEffect(() => {
    if (audioUnlocked && shouldAutoPlay() && donation?.id && !isPlaying && !hasCompleted) {
      const audioUrl = donation.voice_message_url || donation.tts_audio_url;
      if (audioUrl && audioRef.current?.src) {
        console.log('🔓 Audio unlocked, attempting autoplay...');
        setTimeout(() => handlePlay(), 100);
      }
    }
  }, [audioUnlocked, autoPlayTTS, autoPlayVoice, donation?.id, isPlaying, hasCompleted]);

  const unlockAudio = async () => {
    try {
      // Create and resume AudioContext - this is the key for background playback
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('🔊 AudioContext resumed');
      }
      
      // Play silent audio to fully prime the audio system
      const silentAudio = new Audio(SILENT_AUDIO_URL);
      silentAudio.volume = 0.01; // Very low volume just in case
      await silentAudio.play();
      console.log('🔇 Silent audio played to prime AudioContext');
      
      // Clean up after a short delay
      setTimeout(() => {
        silentAudio.pause();
        silentAudio.src = '';
      }, 1000);
      
    } catch (primeError) {
      console.warn('AudioContext priming failed:', primeError);
    }
    
    // Use sessionStorage to persist unlock state
    try {
      sessionStorage.setItem(`audio-unlocked-${tableName}`, 'true');
      console.log('💾 Saved unlock state to sessionStorage');
    } catch (storageError) {
      console.warn('SessionStorage blocked:', storageError);
    }
    
    setAudioUnlocked(true);
    console.log('✅ Audio state set to unlocked');
    toast({ title: 'Audio enabled!', description: 'Controls are now available.' });
  };

  const handlePlay = async () => {
    if (!audioRef.current?.src) {
      console.log('⚠️ No audio source available, waiting for backend TTS...');
      return;
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        setAudioUnlocked(false);
        toast({ title: 'Audio blocked', description: 'Click "Enable Audio" to allow playback', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: 'Failed to play audio', variant: 'destructive' });
      }
      setIsPlaying(false);
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

  // Show unlock overlay if audio not unlocked
  if (!audioUnlocked) {
    return (
      <div className="bg-card rounded-lg p-8 text-center space-y-4">
        <div className="flex justify-center">
          <Volume2 className="w-16 h-16 text-primary animate-pulse" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Enable Audio</h3>
          <p className="text-sm text-muted-foreground">
            Click the button below to enable audio playback and auto-play
          </p>
        </div>
        <Button onClick={unlockAudio} size="lg" className="w-full">
          🔊 Enable Audio
        </Button>
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="bg-card rounded-lg p-6 space-y-4">
        <div className="text-center">
          <p className="text-muted-foreground">No message to play</p>
        </div>

        {/* Persistent Controls - Volume */}
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

        {/* Persistent Controls - Auto-play Toggles */}
        {(onAutoPlayTTSChange || onAutoPlayVoiceChange) && (
          <div className="space-y-3 border-t pt-4">
            <p className="text-xs font-semibold text-center text-muted-foreground">
              Auto-Play Settings
            </p>
            
            {/* TTS Auto-play */}
            {onAutoPlayTTSChange && (
              <div className="flex items-center justify-between gap-3 px-2">
                <div className="flex-1">
                  <Label htmlFor="autoplay-tts" className="text-sm font-medium cursor-pointer">
                    Auto-play TTS Messages
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Text donations ₹70+
                  </p>
                </div>
                <CustomSwitch
                  id="autoplay-tts"
                  checked={autoPlayTTS}
                  onCheckedChange={onAutoPlayTTSChange}
                />
              </div>
            )}
            
            {/* Voice Auto-play */}
            {onAutoPlayVoiceChange && (
              <div className="flex items-center justify-between gap-3 px-2">
                <div className="flex-1">
                  <Label htmlFor="autoplay-voice" className="text-sm font-medium cursor-pointer">
                    Auto-play Voice Messages
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Voice donations ₹150+
                  </p>
                </div>
                <CustomSwitch
                  id="autoplay-voice"
                  checked={autoPlayVoice}
                  onCheckedChange={onAutoPlayVoiceChange}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const hasAudio = donation.voice_message_url || donation.tts_audio_url;
  const isWaitingForTTS = donation.message && !hasAudio;

  if (isWaitingForTTS) {
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

  if (!hasAudio) {
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

  const audioUrl = donation.voice_message_url || donation.tts_audio_url;

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

      {/* Auto-play Toggles */}
      {(onAutoPlayTTSChange || onAutoPlayVoiceChange) && (
        <div className="space-y-3 border-t pt-4">
          <p className="text-xs font-semibold text-center text-muted-foreground">
            Auto-Play Settings
          </p>
          
          {/* TTS Auto-play */}
          {onAutoPlayTTSChange && (
            <div className="flex items-center justify-between gap-3 px-2">
              <div className="flex-1">
                <Label htmlFor="autoplay-tts" className="text-sm font-medium cursor-pointer">
                  Auto-play TTS Messages
                </Label>
                <p className="text-xs text-muted-foreground">
                  Text donations ₹70+
                </p>
              </div>
              <CustomSwitch
                id="autoplay-tts"
                checked={autoPlayTTS}
                onCheckedChange={onAutoPlayTTSChange}
              />
            </div>
          )}
          
          {/* Voice Auto-play */}
          {onAutoPlayVoiceChange && (
            <div className="flex items-center justify-between gap-3 px-2">
              <div className="flex-1">
                <Label htmlFor="autoplay-voice" className="text-sm font-medium cursor-pointer">
                  Auto-play Voice Messages
                </Label>
                <p className="text-xs text-muted-foreground">
                  Voice donations ₹150+
                </p>
              </div>
              <CustomSwitch
                id="autoplay-voice"
                checked={autoPlayVoice}
                onCheckedChange={onAutoPlayVoiceChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};