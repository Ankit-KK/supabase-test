import { useEffect, useRef, useState } from 'react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { Sparkles, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const JhanvooAudioPlayer = () => {
  const {
    currentDonation,
    queueSize,
    autoPlayTTS,
    autoPlayVoice,
    setAutoPlayTTS,
    setAutoPlayVoice,
    markAsPlayed,
  } = useAudioPlayer({ tableName: 'jhanvoo_donations' });

  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!currentDonation) return;

    const playAudio = async () => {
      try {
        // Play TTS first (if exists and autoplay enabled)
        if (currentDonation.tts_audio_url && autoPlayTTS) {
          console.log('Auto-playing TTS:', currentDonation.tts_audio_url);
          if (ttsAudioRef.current) {
            ttsAudioRef.current.src = currentDonation.tts_audio_url;
            setIsPlayingTTS(true);
            await ttsAudioRef.current.play();
            
            await new Promise<void>((resolve) => {
              if (ttsAudioRef.current) {
                ttsAudioRef.current.onended = () => {
                  setIsPlayingTTS(false);
                  resolve();
                };
              }
            });
          }
        }

        // Then play voice message (if exists and autoplay enabled)
        if (currentDonation.voice_message_url && autoPlayVoice) {
          console.log('Auto-playing voice message:', currentDonation.voice_message_url);
          if (voiceAudioRef.current) {
            voiceAudioRef.current.src = currentDonation.voice_message_url;
            setIsPlayingVoice(true);
            await voiceAudioRef.current.play();
            
            await new Promise<void>((resolve) => {
              if (voiceAudioRef.current) {
                voiceAudioRef.current.onended = () => {
                  setIsPlayingVoice(false);
                  resolve();
                };
              }
            });
          }
        }

        // After both audios finish (or if neither played), mark as played
        await markAsPlayed();
      } catch (error) {
        console.error('Error playing audio:', error);
        // Still mark as played even if error occurred
        await markAsPlayed();
      }
    };

    playAudio();
  }, [currentDonation, autoPlayTTS, autoPlayVoice, markAsPlayed]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-black/40 backdrop-blur-md border-indigo-500/30 p-8">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-8 h-8 text-indigo-400" />
          <h1 className="text-2xl font-bold text-white">Jhanvoo Audio Player</h1>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
            <span className="text-white font-medium">Queue Size:</span>
            <span className="text-indigo-400 font-bold text-lg">{queueSize}</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <Label htmlFor="auto-play-tts" className="text-white font-medium cursor-pointer">
                Auto-play TTS
              </Label>
              <Switch
                id="auto-play-tts"
                checked={autoPlayTTS}
                onCheckedChange={setAutoPlayTTS}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <Label htmlFor="auto-play-voice" className="text-white font-medium cursor-pointer">
                Auto-play Voice Messages
              </Label>
              <Switch
                id="auto-play-voice"
                checked={autoPlayVoice}
                onCheckedChange={setAutoPlayVoice}
              />
            </div>
          </div>

          {currentDonation && (
            <div className="p-6 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-lg border border-indigo-500/30">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {isPlayingTTS || isPlayingVoice ? (
                    <Volume2 className="w-8 h-8 text-indigo-400 animate-pulse" />
                  ) : (
                    <VolumeX className="w-8 h-8 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="text-white font-semibold text-lg">
                    {currentDonation.name} - ₹{currentDonation.amount}
                  </div>
                  {currentDonation.message && (
                    <div className="text-gray-300">{currentDonation.message}</div>
                  )}
                  {currentDonation.voice_message_url && (
                    <div className="text-indigo-300 text-sm">🎤 Voice Message</div>
                  )}
                  {isPlayingTTS && (
                    <div className="text-indigo-400 text-sm">▶ Playing TTS...</div>
                  )}
                  {isPlayingVoice && (
                    <div className="text-purple-400 text-sm">▶ Playing Voice...</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!currentDonation && queueSize === 0 && (
            <div className="text-center text-gray-400 py-8">
              No donations in queue
            </div>
          )}

          <audio ref={ttsAudioRef} className="hidden" />
          <audio ref={voiceAudioRef} className="hidden" />
        </div>
      </Card>
    </div>
  );
};

export default JhanvooAudioPlayer;