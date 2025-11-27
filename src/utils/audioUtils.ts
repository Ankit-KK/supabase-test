export class WebAudioPlayer {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;

  async initialize() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
    }

    // Resume context if suspended (happens in background tabs)
    if (this.audioContext.state === 'suspended') {
      console.log('🔄 Resuming suspended AudioContext');
      await this.audioContext.resume();
    }
  }

  async playFromUrl(url: string, volume: number, onEnded: () => void): Promise<void> {
    try {
      await this.initialize();

      if (!this.audioContext || !this.gainNode) {
        throw new Error('AudioContext not initialized');
      }

      // Stop any current playback
      this.stop();

      // Fetch audio data
      console.log('🎵 Web Audio API: Fetching audio from', url);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();

      // Decode audio data
      console.log('🎵 Web Audio API: Decoding audio data');
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // Create and configure source
      this.currentSource = this.audioContext.createBufferSource();
      this.currentSource.buffer = audioBuffer;
      this.currentSource.connect(this.gainNode);

      // Set volume
      this.gainNode.gain.value = volume;

      // Set up ended callback
      this.currentSource.onended = () => {
        console.log('🏁 Web Audio API: Playback ended');
        this.isPlaying = false;
        this.currentSource = null;
        onEnded();
      };

      // Start playback
      this.currentSource.start(0);
      this.isPlaying = true;
      console.log('▶️ Web Audio API: Playback started');

    } catch (error) {
      console.error('❌ Web Audio API error:', error);
      throw error;
    }
  }

  stop() {
    if (this.currentSource && this.isPlaying) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (e) {
        // Source already stopped
      }
      this.currentSource = null;
      this.isPlaying = false;
      console.log('⏹️ Web Audio API: Playback stopped');
    }
  }

  setVolume(volume: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = volume;
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  async resumeContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      console.log('🔄 Resuming AudioContext from suspended state');
      await this.audioContext.resume();
    }
  }

  cleanup() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.gainNode = null;
    }
  }
}
