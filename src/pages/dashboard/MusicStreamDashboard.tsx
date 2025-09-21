import React from 'react';
import StreamerDashboard from '@/components/dashboard/StreamerDashboard';

const MusicStreamDashboard = () => {
  return (
    <StreamerDashboard
      streamerSlug="musicstream"
      streamerName="MusicStream"
      tableName="musicstream_donations"
      brandColor="#8b5cf6"
    />
  );
};

export default MusicStreamDashboard;