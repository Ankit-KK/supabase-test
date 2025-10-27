import React from 'react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

const ChiaGamingAudioPlayer = () => {
  const {
    currentDonation,
    queueSize,
    autoPlayTTS,
    autoPlayVoice,
    autoPlayTTSEnabledAt,
    autoPlayVoiceEnabledAt,
    setAutoPlayTTS,
    setAutoPlayVoice,
    markAsPlayed
  } = useAudioPlayer({
    tableName: 'chiaa_gaming_donations'
  });

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-pink-500">Chia Gaming Audio Player</h1>
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
          autoPlayTTS={autoPlayTTS}
          autoPlayVoice={autoPlayVoice}
          autoPlayTTSEnabledAt={autoPlayTTSEnabledAt}
          autoPlayVoiceEnabledAt={autoPlayVoiceEnabledAt}
          onAutoPlayTTSChange={setAutoPlayTTS}
          onAutoPlayVoiceChange={setAutoPlayVoice}
          tableName="chiaa_gaming_donations"
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

export default ChiaGamingAudioPlayer;