import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PendingDonationsBadgeProps {
  streamerId: string;
  tableName: 'ankit_donations' | 'demostreamer_donations' | 'chia_gaming_donations';
  className?: string;
}

export const PendingDonationsBadge: React.FC<PendingDonationsBadgeProps> = ({
  streamerId,
  tableName,
  className = ""
}) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!streamerId) return;

    const fetchPendingCount = async () => {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('id', { count: 'exact' })
          .eq('streamer_id', streamerId)
          .eq('payment_status', 'success')
          .eq('moderation_status', 'pending');

        if (!error && data) {
          setPendingCount(data.length);
          setIsVisible(data.length > 0);
        }
      } catch (error) {
        console.error('Error fetching pending donations count:', error);
      }
    };

    fetchPendingCount();

    // Subscribe to real-time updates for pending donations
    const channel = supabase
      .channel(`pending-${streamerId}-${tableName}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: `streamer_id=eq.${streamerId}`
        },
        (payload) => {
          // Refetch count when donations change
          fetchPendingCount();
          
          const donation = payload.new as any;
          if (payload.eventType === 'INSERT' && donation?.moderation_status === 'pending') {
            // Play notification sound for new pending donations
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAXBSuBzvLZiTYIG2m98OScTwwOUarm7blqFwU');
            audio.volume = 0.3;
            audio.play().catch(() => {
              // Ignore audio play errors (user interaction required)
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamerId, tableName]);

  if (!isVisible || pendingCount === 0) {
    return null;
  }

  return (
    <Badge 
      variant="destructive" 
      className={`animate-pulse ${className}`}
    >
      <Bell className="w-3 h-3 mr-1" />
      {pendingCount} pending review{pendingCount > 1 ? 's' : ''}
    </Badge>
  );
};