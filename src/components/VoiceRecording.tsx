
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Mic, MicOff, Play, Pause, X } from "lucide-react";

interface VoiceRecordingProps {
  onVoiceSelect: (file: File | null) => void;
  selectedVoice: File | null;
  disabled?: boolean;
  minAmount?: number;
  currentAmount?: number;
}

const VoiceRecording: React.FC<VoiceRecordingProps> = ({ 
  onVoiceSelect, 
  selectedVoice, 
  disabled,
  minAmount = 0,
  currentAmount = 0
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const isEligible = currentAmount >= minAmount;
  const isDisabled = disabled || !isEligible;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        
        setAudioUrl(url);
        onVoiceSelect(file);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({
        title: "Recording started",
        description: "Speak your message into the microphone",
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
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

      toast({
        title: "Recording stopped",
        description: "Your voice message has been recorded",
      });
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const removeVoice = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setIsPlaying(false);
    setRecordingTime(0);
    onVoiceSelect(null);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs sm:text-sm font-medium text-white">
        Voice Message (₹{minAmount}+) {!isEligible && `- Need ₹${minAmount - currentAmount} more`}
      </label>
      
      {!selectedVoice ? (
        <div className="space-y-2">
          {!isRecording ? (
            <Button
              type="button"
              variant="outline"
              onClick={startRecording}
              disabled={isDisabled}
              className="w-full bg-white/95 border-pink-300 text-gray-800 hover:bg-white hover:border-pink-400 h-8 sm:h-9 md:h-10 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mic className="w-4 h-4 mr-2" />
              {!isEligible 
                ? `Donate ₹${minAmount}+ to unlock voice messages`
                : "Start Recording"
              }
            </Button>
          ) : (
            <div className="space-y-2">
              <Button
                type="button"
                variant="destructive"
                onClick={stopRecording}
                className="w-full h-8 sm:h-9 md:h-10 text-sm"
              >
                <MicOff className="w-4 h-4 mr-2" />
                Stop Recording ({formatTime(recordingTime)})
              </Button>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white/80 text-xs">Recording...</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative bg-black/20 rounded-lg p-3 border border-pink-300/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-white text-sm font-medium">
                  Voice Message
                </span>
                <span className="text-white/70 text-xs">
                  ({formatFileSize(selectedVoice.size)})
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeVoice}
                className="text-pink-200 hover:text-pink-100 hover:bg-pink-500/20 h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {audioUrl && (
              <div className="space-y-2">
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={isPlaying ? pauseAudio : playAudio}
                  className="bg-pink-500/20 border-pink-300/50 text-pink-100 hover:bg-pink-500/30"
                >
                  {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {isPlaying ? 'Pause' : 'Play'} Voice Message
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      
      <p className="text-xs text-white/80">
        {isEligible 
          ? "Your voice message will be played as an audio alert on stream"
          : `Donate ₹${minAmount}+ to unlock voice messages that play on stream`
        }
      </p>
    </div>
  );
};

export default VoiceRecording;
