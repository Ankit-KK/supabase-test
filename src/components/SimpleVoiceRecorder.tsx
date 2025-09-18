import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause, RotateCcw } from 'lucide-react';

interface SimpleVoiceRecorderProps {
  onVoiceRecorded: (blob: Blob | null) => void;
}

const SimpleVoiceRecorder: React.FC<SimpleVoiceRecorderProps> = ({ onVoiceRecorded }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        onVoiceRecorded(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const playRecording = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.play();
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const clearRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setIsPlaying(false);
    onVoiceRecorded(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
      <div className="space-y-4">
        {/* Status */}
        {(isRecording || audioBlob) && (
          <div className="text-center">
            <div className="text-xl font-mono text-white">
              {formatTime(duration)}
            </div>
            {isRecording && (
              <div className="text-red-400 text-sm">Recording...</div>
            )}
            {audioBlob && !isRecording && (
              <div className="text-green-400 text-sm">Ready to send</div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-2">
          {!isRecording && !audioBlob && (
            <Button
              type="button"
              onClick={startRecording}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Mic className="h-4 w-4 mr-2" />
              Start Recording
            </Button>
          )}

          {isRecording && (
            <Button
              type="button"
              onClick={stopRecording}
              variant="destructive"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          )}

          {audioBlob && !isRecording && (
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={isPlaying ? stopPlayback : playRecording}
                variant="outline"
                className="border-slate-500 text-white hover:bg-slate-700"
              >
                {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              
              <Button
                type="button"
                onClick={clearRecording}
                variant="outline"
                className="border-slate-500 text-white hover:bg-slate-700"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          )}
        </div>

        {!isRecording && !audioBlob && (
          <div className="text-center text-sm text-slate-400">
            Click to record a voice message (optional)
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleVoiceRecorder;