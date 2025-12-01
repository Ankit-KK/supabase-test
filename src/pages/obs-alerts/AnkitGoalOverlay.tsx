import React from 'react';
import GoalOverlay from '@/components/GoalOverlay';

const AnkitGoalOverlay = () => {
  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden">
      <GoalOverlay
        goalName="New Streaming Mic"
        currentAmount={22400}
        targetAmount={50000}
      />
    </div>
  );
};

export default AnkitGoalOverlay;
