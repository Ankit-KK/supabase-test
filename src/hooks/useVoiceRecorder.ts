import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface VoiceRecorderState {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  duration: number;
  isPlaying: boolean;
}

export const useVoiceRecorder = (maxDurationSeconds: number = 60) => {
  const [state, setState] = useState<VoiceRecorderState>({
    isRecording: false,
    audioBlob: null,
    audioUrl: null,
    duration: 0,
    isPlaying: false,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);

        setState(prev => ({
          ...prev,
          audioBlob,
          audioUrl,
          duration,
          isRecording: false,
        }));

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      
      setState(prev => ({ ...prev, isRecording: true, duration: 0 }));

      // Update duration every second
      timerRef.current = setInterval(() => {
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
        setState(prev => ({ ...prev, duration: elapsed }));

        // Auto-stop at max duration
        if (elapsed >= maxDurationSeconds) {
          stopRecording();
        }
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Failed to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [maxDurationSeconds]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [state.isRecording]);

  const playRecording = useCallback(() => {
    if (state.audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(state.audioUrl);
      audioRef.current = audio;
      
      audio.onplay = () => setState(prev => ({ ...prev, isPlaying: true }));
      audio.onended = () => setState(prev => ({ ...prev, isPlaying: false }));
      audio.onerror = () => setState(prev => ({ ...prev, isPlaying: false }));

      audio.play().catch((error) => {
        console.error('Error playing audio:', error);
        setState(prev => ({ ...prev, isPlaying: false }));
      });
    }
  }, [state.audioUrl]);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const clearRecording = useCallback(() => {
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setState({
      isRecording: false,
      audioBlob: null,
      audioUrl: null,
      duration: 0,
      isPlaying: false,
    });
  }, [state.audioUrl]);

  const uploadRecording = useCallback(async (donationId: string): Promise<string | null> => {
    if (!state.audioBlob) return null;

    try {
      console.log('Starting voice message upload for donation:', donationId);
      const fileName = `${donationId}-${Date.now()}.webm`;
      const filePath = `${fileName}`; // store at bucket root

      console.log('Uploading to path:', filePath);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-messages')
        .upload(filePath, state.audioBlob, {
          contentType: 'audio/webm',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Bucket is public -> get public URL (no policy needed)
      const { data: pub } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(filePath);

      console.log('Public URL:', pub.publicUrl);
      return pub.publicUrl;
      
    } catch (error) {
      console.error('Error uploading voice message:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload voice message. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  }, [state.audioBlob]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [state.audioUrl]);

  return {
    ...state,
    startRecording,
    stopRecording,
    playRecording,
    stopPlayback,
    clearRecording,
    uploadRecording,
    cleanup,
    maxDurationSeconds,
  };
};