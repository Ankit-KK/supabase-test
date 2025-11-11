import React from 'react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { Gamepad2 } from 'lucide-react';

const LooteriyaGamingAudioPlayer = () => {
  const {
    currentDonation,
    queueSize,
    autoPlayTTS,
    autoPlayVoice,
    autoPlayTTSEnabledAt,
    autoPlayVoiceEnabledAt,
    setAutoPlayTTS,
    setAutoPlayVoice,
    markAsPlayed,
  } = useAudioPlayer({
    tableName: 'looteriya_gaming_donations'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-950 via-slate-900 to-amber-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Gamepad2 className="h-8 w-8 text-amber-400" />
            <h1 className="text-3xl font-bold text-white">Looteriya Gaming Voice Messages</h1>
          </div>
          {queueSize > 0 && (
            <div className="inline-block px-4 py-2 bg-amber-500/20 text-amber-300 rounded-full border border-amber-400">
              {queueSize} message{queueSize !== 1 ? 's' : ''} in queue
            </div>
          )}
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
          tableName="looteriya_gaming_donations"
        />

        {queueSize > 1 && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse delay-150"></div>
              </div>
              <span className="text-sm text-slate-400">
                {queueSize - 1} more message{queueSize - 1 !== 1 ? 's' : ''} waiting
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LooteriyaGamingAudioPlayer;
