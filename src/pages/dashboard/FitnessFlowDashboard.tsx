import React from 'react';
import StreamerDashboard from '@/components/dashboard/StreamerDashboard';

const FitnessFlowDashboard = () => {
  return (
    <StreamerDashboard
      streamerSlug="fitnessflow"
      streamerName="FitnessFlow"
      tableName="fitnessflow_donations"
      brandColor="#f59e0b"
    />
  );
};

export default FitnessFlowDashboard;