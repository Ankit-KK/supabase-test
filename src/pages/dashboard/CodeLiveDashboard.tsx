import React from 'react';
import StreamerDashboard from '@/components/dashboard/StreamerDashboard';

const CodeLiveDashboard = () => {
  return (
    <StreamerDashboard
      streamerSlug="codelive"
      streamerName="CodeLive"
      tableName="chia_gaming_donations"
      brandColor="#ef4444"
    />
  );
};

export default CodeLiveDashboard;