import React from 'react';
import StreamerDashboard from '@/components/dashboard/StreamerDashboard';

const Streamer42Dashboard = () => {
  return (
    <StreamerDashboard
      streamerSlug="streamer42"
      streamerName="Streamer 42"
      tableName="streamer42_donations"
      brandColor="#ef4444"
    />
  );
};

export default Streamer42Dashboard;
