import React from 'react';
import StreamerDashboard from '@/components/dashboard/StreamerDashboard';

const CraftMasterDashboard = () => {
  return (
    <StreamerDashboard
      streamerSlug="craftmaster"
      streamerName="CraftMaster"
      brandColor="#8B4513"
      tableName="craftmaster_donations"
    />
  );
};

export default CraftMasterDashboard;
