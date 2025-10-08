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
  streamer_id?: string;
  tts_audio_url?: string;
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
  const donationsRef = useRef<Donation[]>([]);

  const fetchVoiceDonations = useCallback(async () => {
    try {
      setLoading(true);
      
      let data: any = null;
      let error: any = null;

      if (tableName === 'ankit_donations') {
        // For ankit_donations, include tts_audio_url
        let query = supabase
          .from(tableName)
          .select('id, name, amount, message, voice_message_url, created_at, moderation_status, payment_status, streamer_id, tts_audio_url')
          .or('voice_message_url.not.is.null,message.not.is.null')
          .in('moderation_status', ['approved', 'auto_approved'])
          .eq('payment_status', 'success')
          .order('created_at', { ascending: true });

        if (streamerId) {
          query = query.eq('streamer_id', streamerId);
        }

        const result = await query;
        data = result.data;
        error = result.error;
      } else {
        // For other tables, use base fields only
        let query = supabase
          .from(tableName)
          .select('id, name, amount, message, voice_message_url, created_at, moderation_status, payment_status, streamer_id')
          .or('voice_message_url.not.is.null,message.not.is.null')
          .in('moderation_status', ['approved', 'auto_approved'])
          .eq('payment_status', 'success')
          .order('created_at', { ascending: true });

        if (streamerId) {
          query = query.eq('streamer_id', streamerId);
        }

        const result = await query;
        data = result.data;
        error = result.error;
      }

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

  // Keep donationsRef in sync with donations state
  useEffect(() => {
    donationsRef.current = donations;
  }, [donations]);

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
          
          const donationId = (payload.new as any)?.id;
          const eventType = payload.eventType; // 'INSERT', 'UPDATE', or 'DELETE'
          
          // ========================================
          // HANDLE INSERT - New donation created
          // ========================================
          if (eventType === 'INSERT') {
            console.log('➕ INSERT event detected, fetching to add new donation');
            if (refreshTimeoutRef.current) {
              clearTimeout(refreshTimeoutRef.current);
            }
            refreshTimeoutRef.current = setTimeout(() => {
              console.log('Executing debounced refresh for INSERT');
              fetchVoiceDonations();
            }, 1000);
            return;
          }
          
          // ========================================
          // HANDLE UPDATE - Modify existing donation
          // ========================================
          if (eventType === 'UPDATE') {
            console.log('📝 UPDATE event detected, updating in-place');
            
            // Always update in-place, never fetch
            setDonations(prev => prev.map(d => 
              d.id === donationId ? { ...d, ...(payload.new as any) } : d
            ));
            return;
          }
          
          // ========================================
          // HANDLE DELETE - Remove donation
          // ========================================
          if (eventType === 'DELETE') {
            console.log('🗑️ DELETE event detected, removing donation');
            const deletedId = (payload.old as any)?.id;
            setDonations(prev => prev.filter(d => d.id !== deletedId));
            return;
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