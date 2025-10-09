import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gamepad2, SkipBack, SkipForward, RefreshCw } from 'lucide-react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

const TechGamerAudioPlayer = () => {
  const {
    currentDonation,
    queueSize,
    autoPlay,
    autoPlayEnabledAt,
    setAutoPlay,
    markAsPlayed
  } = useAudioPlayer({ tableName: 'techgamer_donations' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gamepad2 className="h-12 w-12 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">TechGamer Voice Messages</h1>
          </div>
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-400">
            {queueSize > 0 ? `${queueSize} message${queueSize > 1 ? 's' : ''} in queue` : 'No messages in queue'}
          </Badge>
        </div>

        {/* Audio Player */}
        <div className="max-w-4xl mx-auto mb-8">
          <AudioPlayer
            donation={currentDonation}
            onPlayComplete={markAsPlayed}
            autoPlay={autoPlay}
            autoPlayEnabledAt={autoPlayEnabledAt}
            onAutoPlayChange={setAutoPlay}
          />
        </div>

        {/* Queue indicator */}
        {queueSize > 1 && (
          <div className="text-center text-sm text-blue-300">
            Next: {queueSize - 1} more message{queueSize > 2 ? 's' : ''} waiting
          </div>
        )}
      </div>
    </div>
  );
};

export default TechGamerAudioPlayer;