// Audio queue for sequential playback
class AudioQueue {
  private queue: Uint8Array[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;

  constructor() {
    this.audioContext = new AudioContext({ sampleRate: 24000 });
  }

  async addToQueue(audioData: Uint8Array) {
    this.queue.push(audioData);
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioData = this.queue.shift()!;

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(audioData.buffer);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => this.playNext();
      source.start(0);
    } catch (error) {
      console.error('Error playing audio chunk:', error);
      this.playNext(); // Continue with next chunk
    }
  }

  clear() {
    this.queue = [];
    this.isPlaying = false;
  }

  async close() {
    this.clear();
    await this.audioContext.close();
  }
}

interface StreamingTTSConfig {
  speaker?: string;
  targetLanguageCode?: string;
  pitch?: number;
  pace?: number;
  loudness?: number;
  onAudioChunk?: (chunk: Uint8Array) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export class StreamingTTS {
  private ws: WebSocket | null = null;
  private audioQueue: AudioQueue;
  private config: StreamingTTSConfig;

  constructor(config: StreamingTTSConfig) {
    this.config = config;
    this.audioQueue = new AudioQueue();
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Connect to our edge function WebSocket relay
      const projectRef = 'vsevsjvtrshgeiudrnth';
      this.ws = new WebSocket(`wss://${projectRef}.supabase.co/functions/v1/stream-donation-tts`);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        
        // Send configuration
        this.ws!.send(JSON.stringify({
          type: 'config',
          data: {
            speaker: this.config.speaker || 'manisha',
            target_language_code: this.config.targetLanguageCode || 'en-IN',
            pitch: this.config.pitch || 0,
            pace: this.config.pace || 1.1,
            loudness: this.config.loudness || 1.2,
            speech_sample_rate: 24000,
            enable_preprocessing: true,
            model: 'bulbul:v2',
            output_audio_codec: 'wav',
            min_buffer_size: 50,
            max_chunk_length: 200,
          }
        }));

        resolve();
      };

      this.ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'audio') {
            // Decode base64 audio chunk
            const audioData = Uint8Array.from(atob(message.data.audio), c => c.charCodeAt(0));
            
            // Add to playback queue
            await this.audioQueue.addToQueue(audioData);
            
            // Notify callback
            if (this.config.onAudioChunk) {
              this.config.onAudioChunk(audioData);
            }
          } else if (message.type === 'error') {
            console.error('Streaming TTS error:', message.message);
            if (this.config.onError) {
              this.config.onError(message.message);
            }
          } else if (message.type === 'complete') {
            console.log('Streaming TTS complete');
            if (this.config.onComplete) {
              this.config.onComplete();
            }
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
      };
    });
  }

  async sendText(text: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    // Limit message length as per Sarvam docs
    const limitedText = text.substring(0, 500);

    this.ws.send(JSON.stringify({
      type: 'text',
      data: { text: limitedText }
    }));
  }

  async flush(): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.ws.send(JSON.stringify({ type: 'flush' }));
  }

  disconnect(): void {
    this.audioQueue.clear();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  async cleanup(): Promise<void> {
    this.disconnect();
    await this.audioQueue.close();
  }
}

// Helper function to generate and stream TTS for donations
export async function streamDonationTTS(
  donorName: string,
  amount: number,
  message?: string
): Promise<void> {
  const tts = new StreamingTTS({
    speaker: 'manisha',
    targetLanguageCode: 'en-IN',
    onError: (error) => console.error('TTS error:', error),
    onComplete: () => console.log('TTS completed'),
  });

  try {
    await tts.connect();
    
    // Format donation announcement
    const donationText = message 
      ? `${donorName} donated ${amount} rupees. ${message}`
      : `${donorName} donated ${amount} rupees. Thank you!`;

    await tts.sendText(donationText);
    await tts.flush();
    
  } catch (error) {
    console.error('Error streaming TTS:', error);
    throw error;
  } finally {
    // Note: Don't cleanup immediately, let audio finish playing
    setTimeout(() => tts.cleanup(), 5000);
  }
}
