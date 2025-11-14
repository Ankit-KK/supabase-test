import React from 'react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { Gamepad2 } from 'lucide-react';

const DamaskPlaysAudioPlayer = () => {
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
    tableName: 'damask_plays_donations'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center border-4 border-emerald-500">
              <Gamepad2 className="w-10 h-10 text-emerald-400" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Damask plays Voice Messages</h1>
            {queueSize > 0 && (
              <div className="text-emerald-300 mt-2">{queueSize} message(s) in queue</div>
            )}
          </div>
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
          tableName="damask_plays_donations"
        />
      </div>
    </div>
  );
};

export default DamaskPlaysAudioPlayer;
