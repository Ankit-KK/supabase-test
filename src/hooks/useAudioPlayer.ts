import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message?: string;
  voice_message_url?: string;
  created_at: string;
  moderation_status: string;
  payment_status: string;
}

type TableName = 'ankit_donations' | 'chia_gaming_donations' | 'demostreamer_donations';

interface UseAudioPlayerProps {
  tableName: TableName;
  streamerId?: string;
}

export const useAudioPlayer = ({ tableName, streamerId }: UseAudioPlayerProps) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchVoiceDonations = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from(tableName)
        .select('id, name, amount, message, voice_message_url, created_at, moderation_status, payment_status')
        .not('voice_message_url', 'is', null)
        .in('moderation_status', ['approved', 'auto_approved'])
        .eq('payment_status', 'success')
        .order('created_at', { ascending: true });

      if (streamerId) {
        query = query.eq('streamer_id', streamerId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching voice donations:', error);
        return;
      }

      setDonations((data || []) as Donation[]);
    } catch (error) {
      console.error('Error in fetchVoiceDonations:', error);
    } finally {
      setLoading(false);
    }
  }, [tableName, streamerId]);

  // Subscribe to real-time updates
  useEffect(() => {
    fetchVoiceDonations();

    const channel = supabase
      .channel(`audio-player-${tableName}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: 'voice_message_url=not.is.null'
        },
        (payload) => {
          console.log('Voice donation update:', payload);
          fetchVoiceDonations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchVoiceDonations, tableName]);

  const currentDonation = donations[currentIndex] || null;

  const goToNext = useCallback(() => {
    if (currentIndex < donations.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // If we're at the end, go back to the beginning
      setCurrentIndex(0);
    }
  }, [currentIndex, donations.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      // If we're at the beginning, go to the end
      setCurrentIndex(donations.length - 1);
    }
  }, [currentIndex, donations.length]);

  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < donations.length) {
      setCurrentIndex(index);
    }
  }, [donations.length]);

  return {
    donations,
    currentDonation,
    currentIndex,
    totalDonations: donations.length,
    autoPlay,
    setAutoPlay,
    loading,
    goToNext,
    goToPrevious,
    goToIndex,
    refresh: fetchVoiceDonations
  };
};