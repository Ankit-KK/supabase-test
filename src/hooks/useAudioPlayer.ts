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
  const [queuedDonations, setQueuedDonations] = useState<Donation[]>([]);
  const [currentDonation, setCurrentDonation] = useState<Donation | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlayEnabledAt, setAutoPlayEnabledAt] = useState<number | null>(null);
  const [pageOpenedAt] = useState(() => new Date().toISOString());
  const MAX_QUEUE_SIZE = 10;

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

  // Subscribe to real-time updates (INSERT + UPDATE events)
  useEffect(() => {
    const channel = supabase
      .channel(`audio-queue-${tableName}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
        },
        (payload) => {
          const newDonation = payload.new as Donation;
          
          // Only process donations created AFTER this page was opened
          if (newDonation.created_at <= pageOpenedAt) {
            console.log('⏭️ Skipping old donation (created before page opened)');
            return;
          }
          
          setQueuedDonations(prev => {
            // Prevent duplicates
            if (prev.some(d => d.id === newDonation.id)) {
              console.log('⏭️ Donation already in queue, skipping');
              return prev;
            }
            
            // Only add approved donations with audio ready
            const isApproved = newDonation.moderation_status === 'approved' || 
                             newDonation.moderation_status === 'auto_approved';
            const isSuccessful = newDonation.payment_status === 'success';
            const hasAudio = newDonation.voice_message_url || newDonation.tts_audio_url;
            
            if (isApproved && isSuccessful && hasAudio) {
              console.log('🆕 New donation added to queue:', newDonation.id);
              
              // Add to queue
              const updated = [...prev, newDonation];
              
              // Limit queue size (FIFO)
              if (updated.length > MAX_QUEUE_SIZE) {
                console.warn(`⚠️ Queue full (${MAX_QUEUE_SIZE}), dropping oldest donation`);
                return updated.slice(1);
              }
              
              console.log(`📊 Queue size: ${updated.length}/${MAX_QUEUE_SIZE}`);
              return updated;
            }
            
            return prev;
          });
        }
      )
      .subscribe((status) => {
        console.log('Audio queue subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to donation changes (INSERT + UPDATE)');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, pageOpenedAt]);

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

  const handleAutoPlayChange = useCallback((enabled: boolean) => {
    setAutoPlay(enabled);
    setAutoPlayEnabledAt(enabled ? Date.now() : null);
  }, []);

  return {
    currentDonation,
    queueSize: queuedDonations.length,
    autoPlay,
    autoPlayEnabledAt,
    setAutoPlay: handleAutoPlayChange,
    markAsPlayed,
    queuedDonations // For debugging
  };
};