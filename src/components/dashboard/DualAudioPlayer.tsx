import { useState } from 'react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useTTSQueue } from '@/hooks/useTTSQueue';
import { TTSPlayer } from './TTSPlayer';
import { AudioPlayer } from '@/components/AudioPlayer';

type TableName = 
  | 'ankit_donations'
  | 'chia_gaming_donations'
  | 'demostreamer_donations'
  | 'techgamer_donations'
  | 'musicstream_donations'
  | 'fitnessflow_donations'
  | 'codelive_donations'
  | 'artcreate_donations';

interface DualAudioPlayerProps {
  tableName: TableName;
  streamerId?: string;
}

export const DualAudioPlayer = ({ tableName, streamerId }: DualAudioPlayerProps) => {
  const [voiceAutoPlay, setVoiceAutoPlay] = useState(false);

  // Voice messages player
  const voicePlayer = useAudioPlayer({
    tableName: tableName as any,
    streamerId,
  });

  // TTS queue player
  const ttsQueue = useTTSQueue({
    tableName: tableName as any,
    streamerId,
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column: Voice Messages */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Voice Messages</h2>
        {voicePlayer.donations.length > 0 ? (
          <AudioPlayer
            donation={voicePlayer.donations[voicePlayer.currentIndex]}
            onNext={voicePlayer.goToNext}
            autoPlay={voiceAutoPlay}
            onAutoPlayChange={setVoiceAutoPlay}
          />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No voice messages available
          </div>
        )}
      </div>

      {/* Right Column: TTS Queue */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">TTS Queue (Auto-Play)</h2>
        <TTSPlayer
          currentDonation={ttsQueue.currentDonation}
          nextDonation={ttsQueue.nextDonation}
          isPlaying={ttsQueue.isPlaying}
          queuePosition={ttsQueue.queuePosition}
          totalInQueue={ttsQueue.totalInQueue}
          onPlay={ttsQueue.startQueue}
          onPause={ttsQueue.pauseQueue}
          onSkip={ttsQueue.skipCurrent}
        />
      </div>
    </div>
  );
};
