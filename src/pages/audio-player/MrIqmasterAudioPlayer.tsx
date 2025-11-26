import React from 'react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { Brain } from 'lucide-react';

const MrIqmasterAudioPlayer = () => {
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
    tableName: 'mriqmaster_donations' as any
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-950 via-teal-900 to-cyan-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-cyan-500/20 flex items-center justify-center border-4 border-cyan-500">
              <Brain className="w-10 h-10 text-cyan-400" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Mr Iqmaster Voice Messages</h1>
            {queueSize > 0 && (
              <div className="text-cyan-300 mt-2">{queueSize} message(s) in queue</div>
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
          tableName="mriqmaster_donations"
        />
      </div>
    </div>
  );
};

export default MrIqmasterAudioPlayer;
