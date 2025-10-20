import React from 'react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

const Demo4AudioPlayer = () => {
  const { currentDonation, queueSize, autoPlay, autoPlayEnabledAt, setAutoPlay, markAsPlayed } = useAudioPlayer({ tableName: 'demo4_donations' as any });

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-rose-500">Demo Streamer 4 Audio Player</h1>
          <p className="text-sm text-muted-foreground">{queueSize > 0 ? `${queueSize} message${queueSize > 1 ? 's' : ''} in queue` : 'No messages'}</p>
        </div>
        <AudioPlayer donation={currentDonation} onPlayComplete={markAsPlayed} autoPlay={autoPlay} autoPlayEnabledAt={autoPlayEnabledAt} onAutoPlayChange={setAutoPlay} tableName="demo4_donations" />
      </div>
    </div>
  );
};

export default Demo4AudioPlayer;
