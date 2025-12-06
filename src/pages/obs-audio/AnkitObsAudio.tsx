import { useEffect, useRef, useState, useCallback } from 'react';
import { usePusherConfig } from '@/hooks/usePusherConfig';
import { usePusherAudioQueue, AudioDonation } from '@/hooks/usePusherAudioQueue';
import { Volume2, Wifi, WifiOff, Loader2 } from 'lucide-react';

const AnkitObsAudio = () => {
  const { config, loading: configLoading, error: configError } = usePusherConfig('ankit');
  const [currentDonation, setCurrentDonation] = useState<AudioDonation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<AudioDonation[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isProcessingRef = useRef(false);

  // Initialize AudioContext on first interaction (OBS auto-allows)
  useEffect(() => {
    audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const playAudio = useCallback(async (url: string): Promise<void> => {
    if (!audioContextRef.current) return;
    
    try {
      // Resume context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      
      return new Promise((resolve) => {
        const source = audioContextRef.current!.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current!.destination);
        source.onended = () => resolve();
        source.start(0);
      });
    } catch (error) {
      console.error('[AnkitObsAudio] Error playing audio:', error);
    }
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || queue.length === 0) return;
    
    isProcessingRef.current = true;
    const donation = queue[0];
    setCurrentDonation(donation);
    setIsPlaying(true);

    console.log('[AnkitObsAudio] Processing donation:', donation.id);

    try {
      // Play TTS first if available
      if (donation.tts_audio_url) {
        console.log('[AnkitObsAudio] Playing TTS:', donation.tts_audio_url);
        await playAudio(donation.tts_audio_url);
      }

      // Then play voice message if available
      if (donation.voice_message_url) {
        console.log('[AnkitObsAudio] Playing voice message:', donation.voice_message_url);
        await playAudio(donation.voice_message_url);
      }
    } catch (error) {
      console.error('[AnkitObsAudio] Error processing donation:', error);
    }

    // Remove from queue and continue
    setQueue(prev => prev.slice(1));
    setCurrentDonation(null);
    setIsPlaying(false);
    isProcessingRef.current = false;
  }, [queue, playAudio]);

  // Process queue when items are added
  useEffect(() => {
    if (queue.length > 0 && !isProcessingRef.current) {
      processQueue();
    }
  }, [queue, processQueue]);

  const handleNewAudioMessage = useCallback((donation: AudioDonation) => {
    console.log('[AnkitObsAudio] Received donation:', donation.id);
    
    // Only add if there's audio to play
    if (donation.tts_audio_url || donation.voice_message_url) {
      setQueue(prev => [...prev, donation]);
    }
  }, []);

  const { connectionStatus } = usePusherAudioQueue({
    streamerSlug: 'ankit',
    pusherKey: config?.key || '',
    pusherCluster: config?.cluster || '',
    delayBeforeDisplay: 60000, // 1-minute delay
    onNewAudioMessage: handleNewAudioMessage,
  });

  if (configLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Connecting...</span>
        </div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="flex items-center gap-2 text-red-400">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm">Connection Error</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-4">
      <div className="flex items-center justify-between bg-black/50 rounded-lg px-4 py-3 backdrop-blur-sm border border-white/10">
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' ? (
            <Wifi className="w-4 h-4 text-green-400" />
          ) : connectionStatus === 'connecting' ? (
            <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400" />
          )}
          <span className="text-xs text-gray-400 uppercase tracking-wide">
            {connectionStatus}
          </span>
        </div>

        {/* Now Playing / Queue */}
        <div className="flex items-center gap-4">
          {isPlaying && currentDonation && (
            <div className="flex items-center gap-2 text-purple-400">
              <Volume2 className="w-4 h-4 animate-pulse" />
              <span className="text-xs">
                Playing: {currentDonation.name}
              </span>
            </div>
          )}
          
          {queue.length > 0 && (
            <div className="text-xs text-gray-400">
              Queue: {queue.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnkitObsAudio;
