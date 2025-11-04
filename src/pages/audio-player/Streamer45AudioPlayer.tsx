import React from 'react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

const Streamer45AudioPlayer = () => {
  const { currentDonation, queueSize, autoPlayTTS, autoPlayVoice, autoPlayTTSEnabledAt, autoPlayVoiceEnabledAt, setAutoPlayTTS, setAutoPlayVoice, markAsPlayed } = useAudioPlayer({ tableName: 'streamer45_donations' as any });

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-primary">Streamer 45 Audio Player</h1>
          <p className="text-sm text-muted-foreground">{queueSize > 0 ? `${queueSize} message${queueSize > 1 ? 's' : ''} in queue` : 'No messages'}</p>
        </div>
        <AudioPlayer donation={currentDonation} onPlayComplete={markAsPlayed} autoPlayTTS={autoPlayTTS} autoPlayVoice={autoPlayVoice} autoPlayTTSEnabledAt={autoPlayTTSEnabledAt} autoPlayVoiceEnabledAt={autoPlayVoiceEnabledAt} onAutoPlayTTSChange={setAutoPlayTTS} onAutoPlayVoiceChange={setAutoPlayVoice} tableName="streamer45_donations" />
      </div>
    </div>
  );
};

export default Streamer45AudioPlayer;
