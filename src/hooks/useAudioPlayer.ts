import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePusherAudioQueue } from './usePusherAudioQueue';
import { usePusherConfig } from './usePusherConfig';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message?: string;
  voice_message_url?: string;
  created_at: string;
  moderation_status: string;
  payment_status: string;
  streamer_id?: string;
  tts_audio_url?: string;
}

type TableName = 'ankit_donations' | 'chiaa_gaming_donations' | 'demostreamer_donations' | 'techgamer_donations' | 'musicstream_donations' | 'fitnessflow_donations' | 'artcreate_donations' | 'codelive_donations' | 'valorantpro_donations' | 'craftmaster_donations' | 'apexlegend_donations' | 'lofibeats_donations' | 'yogatime_donations';

interface UseAudioPlayerProps {
  tableName: TableName;
  streamerId?: string;
}

export const useAudioPlayer = ({ tableName, streamerId }: UseAudioPlayerProps) => {
  const [queuedDonations, setQueuedDonations] = useState<Donation[]>([]);
  const [currentDonation, setCurrentDonation] = useState<Donation | null>(null);
  const [autoPlayTTS, setAutoPlayTTS] = useState(() => {
    const saved = localStorage.getItem(`audio-player-autoplay-tts-${tableName}`);
    return saved === 'true';
  });
  const [autoPlayVoice, setAutoPlayVoice] = useState(() => {
    const saved = localStorage.getItem(`audio-player-autoplay-voice-${tableName}`);
    return saved === 'true';
  });
  const [autoPlayTTSEnabledAt, setAutoPlayTTSEnabledAt] = useState<number | null>(null);
  const [autoPlayVoiceEnabledAt, setAutoPlayVoiceEnabledAt] = useState<number | null>(null);
  const [pageOpenedAt] = useState(() => new Date().toISOString());
  const MAX_QUEUE_SIZE = 10;

  // Get streamer slug from table name
  const streamerSlug = tableName.replace('_donations', '').replace('chiaa_gaming', 'chia_gaming');

  // Get Pusher config from backend
  const { config: pusherConfig } = usePusherConfig(streamerSlug);

  // Real-time audio queue via Pusher (primary source)
  const { connectionStatus: pusherStatus } = usePusherAudioQueue({
    streamerSlug,
    pusherKey: pusherConfig?.key,
    pusherCluster: pusherConfig?.cluster,
    onNewAudioMessage: (donation) => {
      console.log('[AudioPlayer] New audio message via Pusher:', donation);
      setQueuedDonations(prev => {
        // Prevent duplicates
        if (prev.some(d => d.id === donation.id)) {
          console.log('⏭️ Donation already in queue, skipping');
          return prev;
        }
        
        const updated = [...prev, donation];
        if (updated.length > MAX_QUEUE_SIZE) {
          console.warn(`⚠️ Queue full (${MAX_QUEUE_SIZE}), dropping oldest donation`);
          return updated.slice(1);
        }
        
        console.log(`📊 Queue size: ${updated.length}/${MAX_QUEUE_SIZE}`);
        return updated;
      });
    }
  });

  // Fetch only very recent unplayed donations (last 2 minutes)
  useEffect(() => {
    const fetchRecentUnplayed = async () => {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      console.log('📥 Fetching recent unplayed donations (last 2 minutes)...');
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .is('audio_played_at', null)
        .gte('created_at', twoMinutesAgo)
        .in('moderation_status', ['approved', 'auto_approved'])
        .eq('payment_status', 'success')
        .or('voice_message_url.not.is.null,tts_audio_url.not.is.null,message.not.is.null')
        .order('created_at', { ascending: true })
        .limit(MAX_QUEUE_SIZE);

      if (data && !error && data.length > 0) {
        console.log(`📥 Loaded ${data.length} recent donations (last 2 min)`);
        setQueuedDonations(data);
      } else if (error) {
        console.error('❌ Error fetching recent donations:', error);
      } else {
        console.log('📥 No recent donations found');
      }
    };

    fetchRecentUnplayed();
  }, [tableName]);


  // Auto-set current donation from queue
  useEffect(() => {
    if (!currentDonation && queuedDonations.length > 0) {
      console.log('🎯 Setting next donation from queue:', queuedDonations[0].id);
      setCurrentDonation(queuedDonations[0]);
    }
  }, [currentDonation, queuedDonations]);

  const markAsPlayed = useCallback(async () => {
    if (!currentDonation) return;
    
    console.log('✅ Marking donation as played in database:', currentDonation.id);
    
    // Update database to mark as played
    const { error } = await supabase
      .from(tableName)
      .update({ audio_played_at: new Date().toISOString() })
      .eq('id', currentDonation.id);
    
    if (error) {
      console.error('❌ Error marking donation as played:', error);
    } else {
      console.log('✅ Successfully marked as played, removing from queue');
    }
    
    // Remove from queue
    setQueuedDonations(prev => prev.filter(d => d.id !== currentDonation.id));
    
    // Clear current donation (next will be set by useEffect above)
    setCurrentDonation(null);
  }, [currentDonation, tableName]);

  const handleAutoPlayTTSChange = useCallback((enabled: boolean) => {
    setAutoPlayTTS(enabled);
    setAutoPlayTTSEnabledAt(enabled ? Date.now() : null);
    localStorage.setItem(`audio-player-autoplay-tts-${tableName}`, String(enabled));
    console.log(`💾 Auto-play TTS ${enabled ? 'enabled' : 'disabled'} (saved to localStorage)`);
  }, [tableName]);

  const handleAutoPlayVoiceChange = useCallback((enabled: boolean) => {
    setAutoPlayVoice(enabled);
    setAutoPlayVoiceEnabledAt(enabled ? Date.now() : null);
    localStorage.setItem(`audio-player-autoplay-voice-${tableName}`, String(enabled));
    console.log(`💾 Auto-play Voice ${enabled ? 'enabled' : 'disabled'} (saved to localStorage)`);
  }, [tableName]);

  return {
    currentDonation,
    queueSize: queuedDonations.length,
    autoPlayTTS,
    autoPlayVoice,
    autoPlayTTSEnabledAt,
    autoPlayVoiceEnabledAt,
    setAutoPlayTTS: handleAutoPlayTTSChange,
    setAutoPlayVoice: handleAutoPlayVoiceChange,
    markAsPlayed,
    queuedDonations // For debugging
  };
};