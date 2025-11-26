import React from 'react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { Flame } from 'lucide-react';

const SagarUjjwalGamingAudioPlayer = () => {
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
    tableName: 'sagarujjwalgaming_donations'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center border-4 border-red-500">
              <Flame className="w-10 h-10 text-red-400" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-red-500">SAGAR UJJWAL GAMING</h1>
            <p className="text-red-200 mt-2">Audio Player</p>
          </div>
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="px-4 py-2 bg-red-500/10 rounded-lg border border-red-500/20">
              <span className="text-red-300">Queue: </span>
              <span className="text-red-100 font-bold">{queueSize}</span>
            </div>
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
          tableName="sagarujjwalgaming_donations"
        />
      </div>
    </div>
  );
};

export default SagarUjjwalGamingAudioPlayer;