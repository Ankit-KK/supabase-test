import React from 'react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

const ABdevilAudioPlayer = () => {
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
    tableName: 'abdevil_donations'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-950 via-amber-900 to-orange-800 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-orange-400">ABdevil Audio Player</h1>
          <p className="text-sm text-orange-300">
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
          tableName="abdevil_donations"
        />

        {/* Queue indicator */}
        {queueSize > 1 && (
          <div className="text-center text-sm text-orange-300">
            Next: {queueSize - 1} more message{queueSize > 2 ? 's' : ''} waiting
          </div>
        )}
      </div>
    </div>
  );
};

export default ABdevilAudioPlayer;