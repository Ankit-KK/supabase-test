import { useState, useEffect, useCallback, useRef } from 'react';
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

type TableName = 'ankit_donations' | 'chia_gaming_donations' | 'demostreamer_donations' | 'techgamer_donations' | 'musicstream_donations' | 'fitnessflow_donations';

interface UseAudioPlayerProps {
  tableName: TableName;
  streamerId?: string;
}

export const useAudioPlayer = ({ tableName, streamerId }: UseAudioPlayerProps) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlayEnabledAt, setAutoPlayEnabledAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchVoiceDonations = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from(tableName)
        .select('id, name, amount, message, voice_message_url, created_at, moderation_status, payment_status')
        .or('voice_message_url.not.is.null,message.not.is.null')
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
      .channel(`audio-player-${tableName}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
        },
        (payload) => {
          console.log('Voice donation update:', payload);
          
          // Check if the update involves a voice message OR text message
          const hasVoiceMessage = (payload.new as any)?.voice_message_url || 
                                  (payload.old as any)?.voice_message_url;
          const hasTextMessage = (payload.new as any)?.message;
          const isApproved = (payload.new as any)?.moderation_status === 'approved' ||
                             (payload.new as any)?.moderation_status === 'auto_approved';
          const isSuccessful = (payload.new as any)?.payment_status === 'success';
          
          if ((hasVoiceMessage || hasTextMessage) && isApproved && isSuccessful) {
            console.log('Donation with audio/text detected, refreshing...');
            // Debounce: Clear previous timeout and set new one
            if (refreshTimeoutRef.current) {
              clearTimeout(refreshTimeoutRef.current);
            }
            refreshTimeoutRef.current = setTimeout(() => {
              console.log('Executing debounced refresh');
              fetchVoiceDonations();
            }, 1000); // Wait 1 second after last update
          }
        }
      )
      .subscribe((status) => {
        console.log('Audio player subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to voice donations updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to voice donations updates');
        }
      });

    return () => {
      supabase.removeChannel(channel);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
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

  const handleAutoPlayChange = useCallback((enabled: boolean) => {
    setAutoPlay(enabled);
    setAutoPlayEnabledAt(enabled ? Date.now() : null);
  }, []);

  return {
    donations,
    currentDonation,
    currentIndex,
    totalDonations: donations.length,
    autoPlay,
    autoPlayEnabledAt,
    setAutoPlay: handleAutoPlayChange,
    loading,
    goToNext,
    goToPrevious,
    goToIndex,
    refresh: fetchVoiceDonations
  };
};