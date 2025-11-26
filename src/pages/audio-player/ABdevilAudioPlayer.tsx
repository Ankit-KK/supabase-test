import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AudioPlayer } from "@/components/AudioPlayer";
import { usePusherConfig } from "@/hooks/usePusherConfig";
import Pusher from "pusher-js";

interface Donation {
  id: string;
  name: string;
  amount: number;
  message?: string;
  voice_message_url?: string;
  created_at: string;
  tts_audio_url?: string;
  streamer_id?: string;
}

const ABdevilAudioPlayer = () => {
  const [currentDonation, setCurrentDonation] = useState<Donation | null>(null);
  const [autoPlayTTS, setAutoPlayTTS] = useState(false);
  const [autoPlayVoice, setAutoPlayVoice] = useState(false);
  const [autoPlayTTSEnabledAt, setAutoPlayTTSEnabledAt] = useState<number | null>(null);
  const [autoPlayVoiceEnabledAt, setAutoPlayVoiceEnabledAt] = useState<number | null>(null);

  const { config: pusherConfig, loading: configLoading } = usePusherConfig('abdevil');

  useEffect(() => {
    if (!pusherConfig || !pusherConfig.key || !pusherConfig.cluster) return;

    const pusher = new Pusher(pusherConfig.key, {
      cluster: pusherConfig.cluster,
    });

    const channel = pusher.subscribe('abdevil-audio');

    channel.bind('new-audio-message', (data: Donation) => {
      console.log('[ABdevil Audio] New donation received:', data);
      setCurrentDonation(data);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [pusherConfig]);

  if (configLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-950 via-amber-900 to-orange-800 flex items-center justify-center p-4">
        <div className="text-white text-xl">Loading audio player...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-950 via-amber-900 to-orange-800 flex items-center justify-center p-4">
      <AudioPlayer
        donation={currentDonation}
        autoPlayTTS={autoPlayTTS}
        autoPlayVoice={autoPlayVoice}
        autoPlayTTSEnabledAt={autoPlayTTSEnabledAt}
        autoPlayVoiceEnabledAt={autoPlayVoiceEnabledAt}
        onAutoPlayTTSChange={setAutoPlayTTS}
        onAutoPlayVoiceChange={setAutoPlayVoice}
        tableName="abdevil_donations"
      />
    </div>
  );
};

export default ABdevilAudioPlayer;