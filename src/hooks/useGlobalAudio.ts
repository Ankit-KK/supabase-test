import { useState, useRef, useCallback, createContext, useContext } from 'react';

interface GlobalAudioState {
  currentAudio: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
}

interface GlobalAudioActions {
  playAudio: (url: string, onEnded?: () => void) => Promise<void>;
  pauseAudio: () => void;
  stopAudio: () => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  seekTo: (time: number) => void;
}

const GlobalAudioContext = createContext<(GlobalAudioState & GlobalAudioActions) | null>(null);

export const useGlobalAudio = () => {
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onEndedRef = useRef<(() => void) | null>(null);

  const playAudio = useCallback(async (url: string, onEnded?: () => void) => {
    try {
      // Stop current audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Create new audio element
      const audio = new Audio(url);
      audioRef.current = audio;
      onEndedRef.current = onEnded || null;

      // Set up event listeners
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
        setCurrentAudio(null);
        if (onEndedRef.current) {
          onEndedRef.current();
        }
      });

      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
        setCurrentAudio(null);
      });

      // Set volume and play
      audio.volume = isMuted ? 0 : volume;
      await audio.play();
      
      setCurrentAudio(url);
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      setCurrentAudio(null);
    }
  }, [volume, isMuted]);

  const pauseAudio = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentAudio(null);
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : newVolume;
    }
  }, [isMuted]);

  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted);
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume]);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  return {
    currentAudio,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playAudio,
    pauseAudio,
    stopAudio,
    setVolume,
    setMuted: setMuted,
    seekTo,
  };
};

export const useAudioPlayer = (audioUrl: string) => {
  const globalAudio = useGlobalAudio();
  
  const isCurrentlyPlaying = globalAudio.currentAudio === audioUrl && globalAudio.isPlaying;
  const isCurrentAudio = globalAudio.currentAudio === audioUrl;
  
  const play = useCallback(() => {
    globalAudio.playAudio(audioUrl);
  }, [globalAudio, audioUrl]);
  
  const pause = useCallback(() => {
    if (isCurrentAudio) {
      globalAudio.pauseAudio();
    }
  }, [globalAudio, isCurrentAudio]);
  
  const toggle = useCallback(() => {
    if (isCurrentlyPlaying) {
      pause();
    } else {
      play();
    }
  }, [isCurrentlyPlaying, play, pause]);

  return {
    isPlaying: isCurrentlyPlaying,
    isCurrentAudio,
    currentTime: isCurrentAudio ? globalAudio.currentTime : 0,
    duration: isCurrentAudio ? globalAudio.duration : 0,
    play,
    pause,
    toggle,
    volume: globalAudio.volume,
    isMuted: globalAudio.isMuted,
    setVolume: globalAudio.setVolume,
    setMuted: globalAudio.setMuted,
    seekTo: globalAudio.seekTo,
  };
};