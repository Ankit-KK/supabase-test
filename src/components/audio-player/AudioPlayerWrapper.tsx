import React from 'react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { getStreamerConfig } from '@/config/streamers';
import { Gamepad2 } from 'lucide-react';

interface AudioPlayerWrapperProps {
  streamerSlug: string;
}

export const AudioPlayerWrapper: React.FC<AudioPlayerWrapperProps> = ({ streamerSlug }) => {
  const config = getStreamerConfig(streamerSlug);

  if (!config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center text-red-500">
          <p>Invalid streamer slug: {streamerSlug}</p>
        </div>
      </div>
    );
  }

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
    tableName: config.tableName as any
  });

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        background: `linear-gradient(135deg, ${config.brandColor}20 0%, hsl(var(--background)) 50%, ${config.brandColor}10 100%)` 
      }}
    >
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Gamepad2 className="h-8 w-8" style={{ color: config.brandColor }} />
            <h1 className="text-3xl font-bold text-foreground">{config.name} Voice Messages</h1>
          </div>
          {queueSize > 0 && (
            <div 
              className="inline-block px-4 py-2 rounded-full border"
              style={{ 
                backgroundColor: `${config.brandColor}20`,
                borderColor: config.brandColor,
                color: config.brandColor
              }}
            >
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
          tableName={config.tableName as any}
        />

        {queueSize > 1 && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg border border-border">
              <div className="flex gap-1">
                <div 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: config.brandColor }}
                ></div>
                <div 
                  className="w-2 h-2 rounded-full animate-pulse delay-75"
                  style={{ backgroundColor: config.brandColor }}
                ></div>
                <div 
                  className="w-2 h-2 rounded-full animate-pulse delay-150"
                  style={{ backgroundColor: config.brandColor }}
                ></div>
              </div>
              <span className="text-sm text-muted-foreground">
                {queueSize - 1} more message{queueSize - 1 !== 1 ? 's' : ''} waiting
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioPlayerWrapper;
