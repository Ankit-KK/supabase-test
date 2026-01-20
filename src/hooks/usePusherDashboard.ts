import { useEffect, useState, useRef } from 'react';
import Pusher from 'pusher-js';
import { convertToINR } from '@/constants/currencies';

interface DashboardStats {
  totalRevenue: number;
  todayRevenue: number;
  totalDonations: number;
  pendingCount: number;
}

interface DonationUpdate {
  id: string;
  name: string;
  amount: number;
  currency?: string;
  message?: string;
  created_at: string;
  moderation_status: string;
}

interface UsePusherDashboardConfig {
  streamerSlug: string;
  pusherKey?: string;
  pusherCluster?: string;
  onNewDonation?: (donation: DonationUpdate) => void;
  onDonationUpdated?: (data: DonationUpdateEvent) => void;
  onStatsUpdate?: (stats: Partial<DashboardStats>) => void;
}

interface DonationUpdateEvent {
  id: string;
  action: 'approve' | 'reject' | 'pending' | 'auto_approved' | 'hide_message' | 'unhide_message';
  name: string;
  amount: number;
  currency?: string;
  message?: string;
  message_visible?: boolean;
  created_at: string;
  voice_message_url?: string;
  tts_audio_url?: string;
  hypersound_url?: string;
  media_url?: string;
  media_type?: string;
}

export const usePusherDashboard = ({
  streamerSlug,
  pusherKey,
  pusherCluster,
  onNewDonation,
  onDonationUpdated,
  onStatsUpdate
}: UsePusherDashboardConfig) => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [stats, setStats] = useState<Partial<DashboardStats>>({});

  // Store callbacks in refs to prevent reconnection loop
  const onNewDonationRef = useRef(onNewDonation);
  const onDonationUpdatedRef = useRef(onDonationUpdated);
  const onStatsUpdateRef = useRef(onStatsUpdate);

  // Update refs when callbacks change
  useEffect(() => {
    onNewDonationRef.current = onNewDonation;
    onDonationUpdatedRef.current = onDonationUpdated;
    onStatsUpdateRef.current = onStatsUpdate;
  }, [onNewDonation, onDonationUpdated, onStatsUpdate]);

  useEffect(() => {
    // Wait for pusher config to be available
    if (!pusherKey || !pusherCluster) {
      console.log('[PusherDashboard] Waiting for Pusher config...');
      return;
    }

    console.log('[PusherDashboard] Initializing Pusher connection...');
    
    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
    });

    pusher.connection.bind('connecting', () => {
      console.log('[PusherDashboard] Connecting to Pusher...');
      setConnectionStatus('connecting');
    });

    pusher.connection.bind('connected', () => {
      console.log('[PusherDashboard] Connected to Pusher');
      setConnectionStatus('connected');
    });

    pusher.connection.bind('disconnected', () => {
      console.log('[PusherDashboard] Disconnected from Pusher');
      setConnectionStatus('disconnected');
    });

    pusher.connection.bind('error', (err: any) => {
      console.error('[PusherDashboard] Pusher connection error:', err);
      setConnectionStatus('error');
    });

    const channelName = `${streamerSlug}-dashboard`;
    console.log('[PusherDashboard] Subscribing to channel:', channelName);
    const channel = pusher.subscribe(channelName);

    channel.bind('pusher:subscription_succeeded', () => {
      console.log('[PusherDashboard] Subscribed to channel:', channelName);
    });

    // New donation received
    channel.bind('new-donation', (data: DonationUpdate) => {
      console.log('[PusherDashboard] New donation received:', data);
      if (onNewDonationRef.current) {
        onNewDonationRef.current(data);
      }
      // Update stats locally (convert to INR for accurate revenue)
      setStats(prev => ({
        ...prev,
        totalRevenue: (prev.totalRevenue || 0) + convertToINR(data.amount, data.currency || 'INR'),
        totalDonations: (prev.totalDonations || 0) + 1
      }));
    });

    // Stats update (batch refresh if needed)
    channel.bind('stats-update', (data: Partial<DashboardStats>) => {
      console.log('[PusherDashboard] Stats update received:', data);
      setStats(prev => ({ ...prev, ...data }));
      if (onStatsUpdateRef.current) {
        onStatsUpdateRef.current(data);
      }
    });

    // Donation moderation updates (approve, reject, hide, etc.)
    channel.bind('donation-updated', (data: DonationUpdateEvent) => {
      console.log('[PusherDashboard] Donation updated:', data);
      if (onDonationUpdatedRef.current) {
        onDonationUpdatedRef.current(data);
      }
    });

    return () => {
      console.log('[PusherDashboard] Cleaning up Pusher connection');
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [streamerSlug, pusherKey, pusherCluster]);

  return {
    connectionStatus,
    stats
  };
};
