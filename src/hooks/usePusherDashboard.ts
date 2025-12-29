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
  onStatsUpdate?: (stats: Partial<DashboardStats>) => void;
}

export const usePusherDashboard = ({
  streamerSlug,
  pusherKey,
  pusherCluster,
  onNewDonation,
  onStatsUpdate
}: UsePusherDashboardConfig) => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [stats, setStats] = useState<Partial<DashboardStats>>({});

  // Store callbacks in refs to prevent reconnection loop
  const onNewDonationRef = useRef(onNewDonation);
  const onStatsUpdateRef = useRef(onStatsUpdate);

  // Update refs when callbacks change
  useEffect(() => {
    onNewDonationRef.current = onNewDonation;
    onStatsUpdateRef.current = onStatsUpdate;
  }, [onNewDonation, onStatsUpdate]);

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
