import React from 'react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { Sparkles } from 'lucide-react';

const JhanvooAudioPlayer = () => {
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
    tableName: 'jhanvoo_donations'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center border-4 border-indigo-500">
              <Sparkles className="w-10 h-10 text-indigo-400" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Jhanvoo Audio Player</h1>
            {queueSize > 0 && (
              <div className="text-indigo-300 mt-2">{queueSize} message(s) in queue</div>
            )}
          </div>
        </div>

        <AudioPlayer
          donation={currentDonation}
          onPlayComplete={markAsPlayed}
          autoPlayTTS={autoPlayTTS}
          autoPlayVoice={autoPlayVoice}
          autoPlayTTSEnabledAt={autoPlayTTSEnabledAt}
          autoPlayVoiceEnabledAt={autoPlayVoiceEnabledAt}
          onAutoPlayTTSChange={setAutoPlayTTS}
          onAutoPlayVoiceChange={setAutoPlayVoice}
          tableName="jhanvoo_donations"
        />

        {queueSize > 1 && (
          <div className="text-center text-sm text-indigo-300">
            Next: {queueSize - 1} more message{queueSize > 2 ? 's' : ''} waiting
          </div>
        )}
      </div>
    </div>
  );
};

export default JhanvooAudioPlayer;