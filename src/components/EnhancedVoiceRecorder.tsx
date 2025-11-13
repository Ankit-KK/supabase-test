import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Square, Play, Pause, RotateCcw, Check } from 'lucide-react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

interface EnhancedVoiceRecorderProps {
  onRecordingComplete: (hasRecording: boolean, duration: number) => void;
  maxDurationSeconds?: number;
  disabled?: boolean;
  controller?: ReturnType<typeof useVoiceRecorder>;
  requiredAmount?: number;
  currentAmount?: number;
  brandColor?: string;
}

const EnhancedVoiceRecorder: React.FC<EnhancedVoiceRecorderProps> = ({ 
  onRecordingComplete, 
  maxDurationSeconds = 60,
  disabled = false,
  controller,
  requiredAmount = 150,
  currentAmount = 0,
  brandColor = '#6366f1'
}) => {
  const canRecord = currentAmount >= requiredAmount;
  const internalRecorder = useVoiceRecorder(maxDurationSeconds);
  const {
    isRecording,
    audioBlob,
    duration,
    isPlaying,
    startRecording,
    stopRecording,
    playRecording,
    stopPlayback,
    clearRecording,
  } = controller ?? internalRecorder;

  useEffect(() => {
    onRecordingComplete(!!audioBlob, duration);
  }, [audioBlob, duration, onRecordingComplete]);

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
    <Card className="p-4" style={{ 
      background: `linear-gradient(135deg, ${brandColor}08 0%, ${brandColor}15 100%)`,
      borderColor: `${brandColor}40`
    }}>
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="font-medium flex items-center justify-center gap-2" style={{ color: brandColor }}>
            <Mic className="h-4 w-4" />
            Voice Message
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Record up to {maxDurationSeconds} seconds
          </p>
        </div>

        {(isRecording || audioBlob) && (
          <div className="text-center">
            <div className="text-2xl font-mono" style={{ color: brandColor }}>
              {formatTime(duration)}
            </div>
            {isRecording && (
              <div className="w-full rounded-full h-1 mt-2" style={{ backgroundColor: `${brandColor}30` }}>
                <div 
                  className="h-1 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${getRecordingProgress()}%`,
                    backgroundColor: brandColor
                  }}
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

        <div className="flex justify-center gap-2">
          {!isRecording && !audioBlob && (
            <Button
              type="button"
              onClick={startRecording}
              className="gap-2 text-white"
              style={{ backgroundColor: brandColor }}
              disabled={!canRecord}
            >
              <Mic className="h-4 w-4" />
              {canRecord ? 'Start Recording' : `Enter ₹${requiredAmount}+ first`}
            </Button>
          )}

          {isRecording && (
            <Button
              type="button"
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
                type="button"
                onClick={isPlaying ? stopPlayback : playRecording}
                variant="outline"
                className="gap-2"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              
              <Button
                type="button"
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

        {!isRecording && !audioBlob && (
          <div className="text-center text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
            {!canRecord ? (
              <span className="text-yellow-600">
                ⚠️ Enter donation amount (₹{requiredAmount}+) to start recording
              </span>
            ) : (
              <>
                💡 Click "Start Recording" and speak your message clearly. 
                Your voice message will be played on stream with your donation!
                <br />
                <span className="font-medium" style={{ color: brandColor }}>
                  You can record up to {maxDurationSeconds} seconds
                </span>
              </>
            )}
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

export default EnhancedVoiceRecorder;
