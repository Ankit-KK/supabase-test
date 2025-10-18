import React from 'react';
import StreamerDashboard from '@/components/dashboard/StreamerDashboard';

const ArtCreateDashboard = () => {
  return (
    <StreamerDashboard
      streamerSlug="artcreate"
      streamerName="ArtCreate"
      tableName="artcreate_donations"
      brandColor="#ec4899"
    />
  );
};

export default ArtCreateDashboard;