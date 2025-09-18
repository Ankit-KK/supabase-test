import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import StreamerDashboard from '@/components/dashboard/StreamerDashboard';

const DemoStreamerDashboard = () => {
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
      streamerSlug="demostreamer"
      streamerName="Demo Streamer"
      brandColor="#6366f1"
      tableName="demostreamer_donations"
    />
  );
};

export default DemoStreamerDashboard;