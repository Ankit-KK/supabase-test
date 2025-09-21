import React from 'react';
import StreamerDashboard from '@/components/dashboard/StreamerDashboard';

const ArtCreateDashboard = () => {
  return (
    <StreamerDashboard
      streamerSlug="artcreate"
      streamerName="ArtCreate"
      tableName="chia_gaming_donations"
      brandColor="#ec4899"
    />
  );
};

export default ArtCreateDashboard;