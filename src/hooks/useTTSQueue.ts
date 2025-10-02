import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateAndPlayTTS } from '@/utils/donationTTS';

type TableName = 
  | 'ankit_donations'
  | 'chia_gaming_donations'
  | 'demostreamer_donations'
  | 'techgamer_donations'
  | 'musicstream_donations'
  | 'fitnessflow_donations'
  | 'codelive_donations'
  | 'artcreate_donations';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string | null;
  created_at: string;
}

interface UseTTSQueueProps {
  tableName: TableName;
  streamerId?: string;
}

export const useTTSQueue = ({ tableName, streamerId }: UseTTSQueueProps) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [audioCache, setAudioCache] = useState<Map<string, string>>(new Map());

  const fetchTTSDonations = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(tableName as any)
        .select('id, name, amount, message, created_at')
        .eq('payment_status', 'success')
        .in('moderation_status', ['approved', 'auto_approved'])
        .eq('message_visible', true)
        .not('message', 'is', null)
        .is('voice_message_url', null)
        .order('created_at', { ascending: false })
        .limit(50) as { data: any[] | null, error: any };

      if (error) throw error;
      
      const filteredData = streamerId 
        ? (data || []).filter((d: any) => d.streamer_id === streamerId)
        : (data || []);
      
      setDonations(filteredData.map((d: any) => ({
        id: d.id,
        name: d.name,
        amount: d.amount,
        message: d.message,
        created_at: d.created_at
      })));
    } catch (error) {
      console.error('Error fetching TTS donations:', error);
    } finally {
      setLoading(false);
    }
  }, [tableName, streamerId]);

  useEffect(() => {
    fetchTTSDonations();

    const channel = supabase
      .channel(`tts-donations-${tableName}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: streamerId ? `streamer_id=eq.${streamerId}` : undefined,
        },
        () => {
          fetchTTSDonations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, streamerId, fetchTTSDonations]);

  const playNext = useCallback(async () => {
    if (currentIndex >= donations.length) {
      setIsPlaying(false);
      return;
    }

    const donation = donations[currentIndex];
    setIsPlaying(true);

    try {
      await generateAndPlayTTS(donation.name, donation.amount, donation.message || '');
      
      // Wait 2 seconds before playing next
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 2000);
    } catch (error) {
      console.error('TTS playback error:', error);
      // Skip to next on error
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 1000);
    }
  }, [currentIndex, donations]);

  useEffect(() => {
    if (isPlaying && currentIndex < donations.length) {
      playNext();
    } else if (currentIndex >= donations.length) {
      setIsPlaying(false);
    }
  }, [currentIndex, donations.length, isPlaying, playNext]);

  const startQueue = useCallback(() => {
    if (donations.length > 0) {
      setCurrentIndex(0);
      setIsPlaying(true);
    }
  }, [donations.length]);

  const pauseQueue = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const skipCurrent = useCallback(() => {
    if (currentIndex < donations.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentIndex, donations.length]);

  const currentDonation = useMemo(() => {
    return donations[currentIndex] || null;
  }, [donations, currentIndex]);

  const nextDonation = useMemo(() => {
    return donations[currentIndex + 1] || null;
  }, [donations, currentIndex]);

  return {
    donations,
    currentDonation,
    nextDonation,
    isPlaying,
    loading,
    queuePosition: currentIndex + 1,
    totalInQueue: donations.length,
    startQueue,
    pauseQueue,
    skipCurrent,
    refresh: fetchTTSDonations,
  };
};
