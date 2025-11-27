import { useState, useRef, useCallback, useEffect } from 'react';
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
  const selectedMimeTypeRef = useRef<string | undefined>(undefined);
  const maxDurationRef = useRef<number>(maxDurationSeconds);
  const streamRef = useRef<MediaStream | null>(null);

  // Update max duration ref when prop changes
  useEffect(() => {
    maxDurationRef.current = maxDurationSeconds;
  }, [maxDurationSeconds]);

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

      streamRef.current = stream;

      const preferredTypes = ['audio/ogg;codecs=opus','audio/webm;codecs=opus','audio/webm'];
      const supported = (typeof MediaRecorder !== 'undefined' && (MediaRecorder as any).isTypeSupported)
        ? preferredTypes.find(t => (MediaRecorder as any).isTypeSupported(t))
        : undefined;
      selectedMimeTypeRef.current = supported;
      const mediaRecorder = supported ? new MediaRecorder(stream, { mimeType: supported }) : new MediaRecorder(stream);

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        console.log(`📦 Chunk received: ${event.data.size} bytes`);
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log(`✅ Chunk added. Total chunks: ${chunksRef.current.length}`);
        } else {
          console.log('⚠️ Empty chunk ignored');
        }
      };

      mediaRecorder.onstop = () => {
        console.log(`🎬 Recording stopped. Total chunks collected: ${chunksRef.current.length}`);
        const totalSize = chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
        console.log(`📊 Total audio data size: ${totalSize} bytes`);
        
        const mime = selectedMimeTypeRef.current || 'audio/webm;codecs=opus';
        const audioBlob = new Blob(chunksRef.current, { type: mime });
        console.log(`🔊 Final blob created: ${audioBlob.size} bytes, mime: ${mime}`);
        
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
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      console.log('🎤 Starting MediaRecorder with 500ms timeslice');
      mediaRecorder.start(500); // Collect data every 500ms for better browser compatibility
      
      setState(prev => ({ ...prev, isRecording: true, duration: 0 }));

      // Update duration every second
      timerRef.current = setInterval(() => {
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
        setState(prev => ({ ...prev, duration: elapsed }));

        // Auto-stop at max duration using ref (not stale closure)
        if (elapsed >= maxDurationRef.current) {
          console.log('⏱️ Auto-stopping at max duration, requesting final data flush');
          // Request any buffered audio data before stopping
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.requestData();
            // Small delay to allow requestData to complete
            setTimeout(() => {
              if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
              }
            }, 100);
          }
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
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
  }, []);

  const stopRecording = useCallback(() => {
    // Check minimum recording duration (1 second)
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    if (elapsed < 1) {
      toast({
        title: "Recording Too Short",
        description: "Please record for at least 1 second",
        variant: "destructive",
      });
      return;
    }

    console.log('🛑 Stopping recording, requesting final data flush');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      // Request any buffered audio data to be flushed before stopping
      mediaRecorderRef.current.requestData();
      
      // Small delay to allow requestData to complete before stopping
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      }, 100);
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

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
    
    // Stop any ongoing recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
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
    if (!state.audioBlob) {
      console.error('No audio blob available');
      return null;
    }

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const mimeType = state.audioBlob.type || 'audio/webm';
      const extension = mimeType.includes('ogg') ? 'ogg' : 'webm';
      const fileName = `voice_${donationId}_${timestamp}_${random}.${extension}`;

      console.log('Uploading voice message:', fileName, mimeType);

      // Upload to storage
      const { data, error } = await supabase.storage
        .from('voice-messages')
        .upload(fileName, state.audioBlob, {
          contentType: mimeType,
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(fileName);

      console.log('Voice message uploaded successfully:', publicUrl);
      return publicUrl;

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
  useEffect(() => {
    return () => {
      if (state.audioUrl) {
        URL.revokeObjectURL(state.audioUrl);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [state.audioUrl]);

  return {
    ...state,
    startRecording,
    stopRecording,
    playRecording,
    stopPlayback,
    clearRecording,
    uploadRecording,
  };
};
