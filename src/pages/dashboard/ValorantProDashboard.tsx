import React from 'react';
import StreamerDashboard from '@/components/dashboard/StreamerDashboard';

const ValorantProDashboard = () => {
  return (
    <StreamerDashboard
      streamerSlug="valorantpro"
      streamerName="ValorantPro"
      brandColor="#ff4655"
      tableName="valorantpro_donations"
    />
  );
};

export default ValorantProDashboard;
