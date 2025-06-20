
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
  const maxDurationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const isEligible = currentAmount >= minAmount;
  const isDisabled = disabled || !isEligible;

  // Calculate max recording duration based on donation amount
  const getMaxDuration = (): number => {
    if (currentAmount < 150) return 15; // 15 seconds for donations less than ₹150
    if (currentAmount >= 150 && currentAmount < 300) return 30; // 30 seconds for ₹150-299
    return 60; // 60 seconds for ₹300+
  };

  const maxDuration = getMaxDuration();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Use webm format with opus codec for better compatibility
      const options = {
        mimeType: 'audio/webm;codecs=opus'
      };
      
      // Fallback to basic webm if opus not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/webm';
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      console.log('VOICE: Starting recording with format:', options.mimeType);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log('VOICE: Audio chunk received:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = () => {
        console.log('VOICE: Recording stopped, processing audio data');
        const audioBlob = new Blob(chunksRef.current, { type: options.mimeType });
        const file = new File([audioBlob], `voice-${Date.now()}.webm`, { type: options.mimeType });
        const url = URL.createObjectURL(audioBlob);
        
        console.log('VOICE: Created voice file:', {
          name: file.name,
          size: file.size,
          type: file.type,
          url: url.substring(0, 50) + '...'
        });
        
        setAudioUrl(url);
        onVoiceSelect(file);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Auto-stop recording when max duration is reached
      maxDurationTimerRef.current = setTimeout(() => {
        if (isRecording && mediaRecorderRef.current) {
          stopRecording();
          toast({
            title: "Recording stopped",
            description: `Maximum duration of ${maxDuration} seconds reached`,
          });
        }
      }, maxDuration * 1000);

      toast({
        title: "Recording started",
        description: `Speak your message (max ${maxDuration} seconds)`,
      });
    } catch (error) {
      console.error("VOICE ERROR: Error starting recording:", error);
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('VOICE: Stopping recording...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
        maxDurationTimerRef.current = null;
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

    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
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

  const getDurationText = (): string => {
    if (currentAmount < 150) return "15s max";
    if (currentAmount >= 150 && currentAmount < 300) return "30s max";
    return "60s max";
  };

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-white">
        Voice Message (₹{minAmount}+) {!isEligible && `- Need ₹${minAmount - currentAmount} more`}
      </label>
      
      {!selectedVoice ? (
        <div className="space-y-1">
          {!isRecording ? (
            <Button
              type="button"
              variant="outline"
              onClick={startRecording}
              disabled={isDisabled}
              className="w-full bg-white/95 border-pink-300 text-gray-800 hover:bg-white hover:border-pink-400 h-7 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mic className="w-3 h-3 mr-1" />
              {!isEligible 
                ? `Donate ₹${minAmount}+ to unlock`
                : `Start Recording (${getDurationText()})`
              }
            </Button>
          ) : (
            <div className="space-y-1">
              <Button
                type="button"
                variant="destructive"
                onClick={stopRecording}
                className="w-full h-7 text-xs"
              >
                <MicOff className="w-3 h-3 mr-1" />
                Stop Recording ({formatTime(recordingTime)}/{maxDuration}s)
              </Button>
              <div className="flex items-center justify-center space-x-1">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white/80 text-xs">Recording... ({getDurationText()})</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <div className="relative bg-black/20 rounded-lg p-2 border border-pink-300/50">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-1">
                <span className="text-white text-xs font-medium">
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
                className="text-pink-200 hover:text-pink-100 hover:bg-pink-500/20 h-5 w-5 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            
            {audioUrl && (
              <div className="space-y-1">
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
                  className="bg-pink-500/20 border-pink-300/50 text-pink-100 hover:bg-pink-500/30 text-xs h-6"
                >
                  {isPlaying ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      
      <p className="text-xs text-white/80">
        {isEligible 
          ? `Voice plays as audio alert on stream (${getDurationText()})`
          : `Donate ₹${minAmount}+ to unlock voice messages`
        }
      </p>
    </div>
  );
};

export default VoiceRecording;
