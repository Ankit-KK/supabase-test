import React from 'react';
import StreamerDashboard from '@/components/dashboard/StreamerDashboard';

const LofiBeatsDashboard = () => {
  return (
    <StreamerDashboard
      streamerSlug="lofibeats"
      streamerName="LofiBeats"
      brandColor="#9b59b6"
      tableName="lofibeats_donations"
    />
  );
};

export default LofiBeatsDashboard;
