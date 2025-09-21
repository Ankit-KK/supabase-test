import React from 'react';
import StreamerDashboard from '@/components/dashboard/StreamerDashboard';

const TechGamerDashboard = () => {
  return (
    <StreamerDashboard
      streamerSlug="techgamer"
      streamerName="TechGamer"
      tableName="techgamer_donations"
      brandColor="#10b981"
    />
  );
};

export default TechGamerDashboard;