import React from 'react';
import StreamerDashboard from '@/components/dashboard/StreamerDashboard';

const DamaskPlaysDashboard = () => {
  return (
    <StreamerDashboard
      streamerSlug="damask_plays"
      streamerName="Damask plays"
      brandColor="#10b981"
      tableName="damask_plays_donations"
    />
  );
};

export default DamaskPlaysDashboard;
