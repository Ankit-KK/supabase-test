import { useRef, useCallback } from 'react';

/**
 * WebAudio-based audio player that enforces the "Fetch Once" invariant.
 * 
 * Core Principle: "Any component that can reload without preserving 
 * JavaScript memory must never be responsible for media playback."
 * 
 * This hook:
 * - Fetches audio ONCE into ArrayBuffer
 * - Decodes to AudioBuffer in memory
 * - Cleans up after playback to prevent memory leaks
 * - Handles AudioContext lifecycle for OBS Browser Source
 */
export function useWebAudioPlayer() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentBufferRef = useRef<AudioBuffer | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const currentAudioIdRef = useRef<string | null>(null);
  const isPlayingRef = useRef(false);

  // CRITICAL FIX #1: Explicit AudioContext unlock + resume
  const unlockAudio = useCallback(async (): Promise<boolean> => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || 
          (window as any).webkitAudioContext)();
        console.log('[WebAudio] AudioContext created');
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
        console.log('[WebAudio] AudioContext resumed');
      }
      
      return audioContextRef.current.state === 'running';
    } catch (error) {
      console.error('[WebAudio] Failed to unlock audio:', error);
      return false;
    }
  }, []);

  // Play audio from URL - fetches ONCE, stores in memory
  const playAudio = useCallback(async (
    audioUrl: string, 
    donationId: string,
    onEnded?: () => void
  ): Promise<boolean> => {
    // CRITICAL FIX #3: Fetch deduplication guard
    if (currentAudioIdRef.current === donationId) {
      console.log('[WebAudio] Skipping duplicate fetch for:', donationId);
      return false;
    }

    // Ensure AudioContext is ready
    const isUnlocked = await unlockAudio();
    if (!isUnlocked || !audioContextRef.current) {
      console.error('[WebAudio] AudioContext not available');
      return false;
    }

    // Stop any currently playing audio
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
        currentSourceRef.current.disconnect();
      } catch (e) {
        // Ignore if already stopped
      }
    }

    // CRITICAL FIX #4: Clear previous buffer to control memory
    currentBufferRef.current = null;

    try {
      console.log('[WebAudio] Fetching audio ONCE:', audioUrl);
      
      // Fetch audio data ONCE
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Decode to AudioBuffer
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      
      // Store in memory for potential replay (capped at 1 buffer)
      currentBufferRef.current = audioBuffer;
      currentAudioIdRef.current = donationId;
      
      // Create and play source
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        console.log('[WebAudio] Playback ended:', donationId);
        isPlayingRef.current = false;
        currentSourceRef.current = null;
        
        // CRITICAL FIX #4: Clear buffer after playback
        currentBufferRef.current = null;
        
        onEnded?.();
      };
      
      source.start(0);
      currentSourceRef.current = source;
      isPlayingRef.current = true;
      
      console.log('[WebAudio] Playing from memory:', donationId);
      return true;
    } catch (error) {
      console.error('[WebAudio] Error playing audio:', error);
      currentAudioIdRef.current = null;
      return false;
    }
  }, [unlockAudio]);

  // Stop current playback
  const stop = useCallback(() => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
        currentSourceRef.current.disconnect();
      } catch (e) {
        // Ignore if already stopped
      }
      currentSourceRef.current = null;
    }
    isPlayingRef.current = false;
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    stop();
    currentBufferRef.current = null;
    currentAudioIdRef.current = null;
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, [stop]);

  return {
    unlockAudio,
    playAudio,
    stop,
    cleanup,
    isPlaying: () => isPlayingRef.current,
    getContext: () => audioContextRef.current,
  };
}
