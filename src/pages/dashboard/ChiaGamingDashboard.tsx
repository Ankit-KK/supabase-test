import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import StreamerDashboard from '@/components/dashboard/StreamerDashboard';

const ChiaGamingDashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <StreamerDashboard
      streamerSlug="chia_gaming"
      streamerName="Chia Gaming"
      brandColor="#ec4899"
      tableName="chia_gaming_donations"
    />
  );
};

export default ChiaGamingDashboard;