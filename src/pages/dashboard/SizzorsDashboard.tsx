import React from 'react';
import StreamerDashboard from '@/components/dashboard/StreamerDashboard';

const SizzorsDashboard = () => {
  return (
    <StreamerDashboard
      streamerSlug="sizzors"
      streamerName="Sizzors"
      tableName="sizzors_donations"
      brandColor="#8b5cf6"
    />
  );
};

export default SizzorsDashboard;