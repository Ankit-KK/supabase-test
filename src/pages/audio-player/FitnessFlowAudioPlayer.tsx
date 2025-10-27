import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, SkipBack, SkipForward, RefreshCw } from 'lucide-react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

const FitnessFlowAudioPlayer = () => {
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
  } = useAudioPlayer({ tableName: 'fitnessflow_donations' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-950 via-slate-900 to-orange-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Dumbbell className="h-12 w-12 text-orange-400" />
            <h1 className="text-4xl font-bold text-white">FitnessFlow Voice Messages</h1>
          </div>
          <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-400">
            {queueSize > 0 ? `${queueSize} message${queueSize > 1 ? 's' : ''} in queue` : 'No messages in queue'}
          </Badge>
        </div>

        {/* Audio Player */}
        <div className="max-w-4xl mx-auto mb-8">
          <AudioPlayer
            donation={currentDonation}
            onPlayComplete={markAsPlayed}
            autoPlayTTS={autoPlayTTS}
            autoPlayVoice={autoPlayVoice}
            autoPlayTTSEnabledAt={autoPlayTTSEnabledAt}
            autoPlayVoiceEnabledAt={autoPlayVoiceEnabledAt}
            onAutoPlayTTSChange={setAutoPlayTTS}
            onAutoPlayVoiceChange={setAutoPlayVoice}
            tableName="fitnessflow_donations"
          />
        </div>

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

export default FitnessFlowAudioPlayer;