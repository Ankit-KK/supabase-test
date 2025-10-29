import React from 'react';
import StreamerDashboard from '@/components/dashboard/StreamerDashboard';

const ApexLegendDashboard = () => {
  return (
    <StreamerDashboard
      streamerSlug="apexlegend"
      streamerName="ApexLegend"
      brandColor="#e74c3c"
      tableName="apexlegend_donations"
    />
  );
};

export default ApexLegendDashboard;
