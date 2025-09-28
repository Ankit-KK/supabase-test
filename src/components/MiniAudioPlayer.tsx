import React from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useAudioPlayer } from '@/hooks/useGlobalAudio';

interface MiniAudioPlayerProps {
  audioUrl: string;
  className?: string;
}

export const MiniAudioPlayer: React.FC<MiniAudioPlayerProps> = ({ 
  audioUrl, 
  className = '' 
}) => {
  const {
    isPlaying,
    isCurrentAudio,
    currentTime,
    duration,
    toggle,
    volume,
    isMuted,
    setVolume,
    setMuted,
    seekTo,
  } = useAudioPlayer(audioUrl);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-muted/50 rounded-lg p-3 space-y-2 ${className}`}>
      {/* Progress Bar - Only show if this audio is currently active */}
      {isCurrentAudio && duration > 0 && (
        <div className="space-y-1">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={(value) => seekTo(value[0])}
            className="w-full h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggle}
            className="w-8 h-8 p-0"
          >
            {isPlaying ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3 ml-0.5" />
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            Voice Message
          </span>
        </div>

        {/* Volume Control - Only show if this audio is currently active */}
        {isCurrentAudio && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMuted(!isMuted)}
              className="w-6 h-6 p-0"
            >
              {isMuted ? (
                <VolumeX className="w-3 h-3" />
              ) : (
                <Volume2 className="w-3 h-3" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              max={100}
              step={1}
              onValueChange={(value) => setVolume(value[0] / 100)}
              className="w-16"
            />
          </div>
        )}
      </div>
    </div>
  );
};