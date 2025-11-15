import React from 'react';
import StreamerDashboard from '@/components/dashboard/StreamerDashboard';

const NekoXenpaiDashboard = () => {
  return (
    <StreamerDashboard
      streamerSlug="neko_xenpai"
      streamerName="Neko XENPAI"
      tableName="neko_xenpai_donations"
      brandColor="#d946ef"
    />
  );
};

export default NekoXenpaiDashboard;
