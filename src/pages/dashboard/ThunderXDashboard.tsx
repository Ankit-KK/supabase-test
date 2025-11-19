import React from 'react';
import StreamerDashboard from '@/components/dashboard/StreamerDashboard';

const ThunderXDashboard = () => {
  return (
    <StreamerDashboard
      streamerSlug="thunderx"
      streamerName="THUNDERX"
      tableName="thunderx_donations"
      brandColor="#10b981"
    />
  );
};

export default ThunderXDashboard;