import React from 'react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const DemoStreamerAudioPlayer = () => {
  const {
    currentDonation,
    queueSize,
    autoPlay,
    autoPlayEnabledAt,
    setAutoPlay,
    markAsPlayed
  } = useAudioPlayer({
    tableName: 'demostreamer_donations'
  });

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-primary">Demo Streamer Audio Player</h1>
          <p className="text-sm text-muted-foreground">
            {queueSize > 0 
              ? `${queueSize} message${queueSize > 1 ? 's' : ''} in queue`
              : 'No messages in queue'
            }
          </p>
        </div>

        {/* Audio Player */}
        <AudioPlayer
          donation={currentDonation}
          onPlayComplete={markAsPlayed}
          autoPlay={autoPlay}
          autoPlayEnabledAt={autoPlayEnabledAt}
          onAutoPlayChange={setAutoPlay}
        />

        {/* Queue indicator */}
        {queueSize > 1 && (
          <div className="text-center text-sm text-muted-foreground">
            Next: {queueSize - 1} more message{queueSize > 2 ? 's' : ''} waiting
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoStreamerAudioPlayer;