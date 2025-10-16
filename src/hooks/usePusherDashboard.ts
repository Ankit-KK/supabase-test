import { useEffect, useState, useCallback } from 'react';
import Pusher from 'pusher-js';

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
  message?: string;
  created_at: string;
  moderation_status: string;
}

interface UsePusherDashboardConfig {
  streamerSlug: string;
  pusherKey: string;
  pusherCluster: string;
  onNewDonation?: (donation: DonationUpdate) => void;
  onDonationApproved?: (donationId: string) => void;
  onDonationRejected?: (donationId: string) => void;
  onStatsUpdate?: (stats: Partial<DashboardStats>) => void;
}

export const usePusherDashboard = ({
  streamerSlug,
  pusherKey,
  pusherCluster,
  onNewDonation,
  onDonationApproved,
  onDonationRejected,
  onStatsUpdate
}: UsePusherDashboardConfig) => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [stats, setStats] = useState<Partial<DashboardStats>>({});

  useEffect(() => {
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
      if (onNewDonation) {
        onNewDonation(data);
      }
      // Update stats locally
      setStats(prev => ({
        ...prev,
        totalRevenue: (prev.totalRevenue || 0) + data.amount,
        totalDonations: (prev.totalDonations || 0) + 1,
        pendingCount: (prev.pendingCount || 0) + 1
      }));
    });

    // Donation approved
    channel.bind('donation-approved', (data: { id: string }) => {
      console.log('[PusherDashboard] Donation approved:', data.id);
      if (onDonationApproved) {
        onDonationApproved(data.id);
      }
      setStats(prev => ({
        ...prev,
        pendingCount: Math.max(0, (prev.pendingCount || 0) - 1)
      }));
    });

    // Donation rejected
    channel.bind('donation-rejected', (data: { id: string }) => {
      console.log('[PusherDashboard] Donation rejected:', data.id);
      if (onDonationRejected) {
        onDonationRejected(data.id);
      }
      setStats(prev => ({
        ...prev,
        pendingCount: Math.max(0, (prev.pendingCount || 0) - 1)
      }));
    });

    // Stats update (batch refresh if needed)
    channel.bind('stats-update', (data: Partial<DashboardStats>) => {
      console.log('[PusherDashboard] Stats update received:', data);
      setStats(prev => ({ ...prev, ...data }));
      if (onStatsUpdate) {
        onStatsUpdate(data);
      }
    });

    return () => {
      console.log('[PusherDashboard] Cleaning up Pusher connection');
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [streamerSlug, pusherKey, pusherCluster, onNewDonation, onDonationApproved, onDonationRejected, onStatsUpdate]);

  return {
    connectionStatus,
    stats
  };
};
