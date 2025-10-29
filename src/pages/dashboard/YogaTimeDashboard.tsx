import React from 'react';
import StreamerDashboard from '@/components/dashboard/StreamerDashboard';

const YogaTimeDashboard = () => {
  return (
    <StreamerDashboard
      streamerSlug="yogatime"
      streamerName="YogaTime"
      brandColor="#27ae60"
      tableName="yogatime_donations"
    />
  );
};

export default YogaTimeDashboard;
