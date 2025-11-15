import React from 'react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { Cat } from 'lucide-react';

const NekoXenpaiAudioPlayer = () => {
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
    tableName: 'neko_xenpai_donations'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-950 via-slate-900 to-fuchsia-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-fuchsia-500/20 flex items-center justify-center border-4 border-fuchsia-500">
              <Cat className="w-10 h-10 text-fuchsia-400" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Neko XENPAI Voice Messages</h1>
            {queueSize > 0 && (
              <div className="text-fuchsia-300 mt-2">{queueSize} message(s) in queue</div>
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
          tableName="neko_xenpai_donations"
        />
      </div>
    </div>
  );
};

export default NekoXenpaiAudioPlayer;
