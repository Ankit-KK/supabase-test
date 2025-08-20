import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Square, Play, Pause, RotateCcw, Check } from 'lucide-react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

interface VoiceRecorderProps {
  onRecordingComplete: (hasRecording: boolean, duration: number) => void;
  maxDurationSeconds?: number;
  disabled?: boolean;
  controller?: ReturnType<typeof useVoiceRecorder>;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ 
  onRecordingComplete, 
  maxDurationSeconds = 60,
  disabled = false,
  controller
}) => {
  const internalRecorder = useVoiceRecorder(maxDurationSeconds);
  const {
    isRecording,
    audioBlob,
    audioUrl,
    duration,
    isPlaying,
    startRecording,
    stopRecording,
    playRecording,
    stopPlayback,
    clearRecording,
    cleanup,
  } = controller ?? internalRecorder;

  useEffect(() => {
    console.log('VoiceRecorder useEffect - audioBlob:', !!audioBlob, 'duration:', duration);
    onRecordingComplete(!!audioBlob, duration);
  }, [audioBlob, duration, onRecordingComplete]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRecordingProgress = () => {
    return Math.min((duration / maxDurationSeconds) * 100, 100);
  };

  if (disabled) {
    return (
      <Card className="p-4 bg-muted/20 border-dashed">
        <div className="text-center text-muted-foreground">
          <Mic className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Voice recording disabled for this donation type</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-gaming-pink-primary/5 to-gaming-pink-secondary/5 border-gaming-pink-primary/20">
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center">
          <h3 className="font-medium text-gaming-pink-primary flex items-center justify-center gap-2">
            <Mic className="h-4 w-4" />
            Voice Message
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Record up to {maxDurationSeconds} seconds
          </p>
        </div>

        {/* Recording Status */}
        {(isRecording || audioBlob) && (
          <div className="text-center">
            <div className="text-2xl font-mono text-gaming-pink-primary">
              {formatTime(duration)}
            </div>
            {isRecording && (
              <div className="w-full bg-gaming-pink-primary/20 rounded-full h-1 mt-2">
                <div 
                  className="bg-gaming-pink-primary h-1 rounded-full transition-all duration-1000"
                  style={{ width: `${getRecordingProgress()}%` }}
                />
              </div>
            )}
            {audioBlob && !isRecording && (
              <div className="flex items-center justify-center gap-1 mt-1">
                <Check className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600">Recording complete</span>
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-2">
          {!isRecording && !audioBlob && (
            <Button
              onClick={startRecording}
              className="bg-gaming-pink-primary hover:bg-gaming-pink-secondary text-white gap-2"
            >
              <Mic className="h-4 w-4" />
              Start Recording
            </Button>
          )}

          {isRecording && (
            <Button
              onClick={stopRecording}
              variant="destructive"
              className="gap-2"
            >
              <Square className="h-4 w-4" />
              Stop
            </Button>
          )}

          {audioBlob && !isRecording && (
            <div className="flex gap-2">
              <Button
                onClick={isPlaying ? stopPlayback : playRecording}
                variant="outline"
                className="gap-2"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              
              <Button
                onClick={clearRecording}
                variant="outline"
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Re-record
              </Button>
            </div>
          )}
        </div>

        {/* Instructions */}
        {!isRecording && !audioBlob && (
          <div className="text-center text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
            💡 Click "Start Recording" and speak your message clearly. 
            Your voice message will be played on stream with your donation!
          </div>
        )}

        {audioBlob && (
          <div className="text-center text-xs text-green-600 bg-green-50 rounded-lg p-3">
            ✅ Voice message ready! You can play it back or re-record if needed.
          </div>
        )}
      </div>
    </Card>
  );
};

export default VoiceRecorder;