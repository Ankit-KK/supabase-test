import React from 'react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

const Demo2AudioPlayer = () => {
  const { currentDonation, queueSize, autoPlay, autoPlayEnabledAt, setAutoPlay, markAsPlayed } = useAudioPlayer({ tableName: 'demo2_donations' });

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-cyan-500">Demo Streamer 2 Audio Player</h1>
          <p className="text-sm text-muted-foreground">{queueSize > 0 ? `${queueSize} message${queueSize > 1 ? 's' : ''} in queue` : 'No messages in queue'}</p>
        </div>
        <AudioPlayer donation={currentDonation} onPlayComplete={markAsPlayed} autoPlay={autoPlay} autoPlayEnabledAt={autoPlayEnabledAt} onAutoPlayChange={setAutoPlay} tableName="demo2_donations" />
      </div>
    </div>
  );
};

export default Demo2AudioPlayer;
