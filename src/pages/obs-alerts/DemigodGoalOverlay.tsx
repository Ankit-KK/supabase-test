import { GoalOverlayWrapper } from '@/components/obs/GoalOverlayWrapper';

const DemigodGoalOverlay = () => {
  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden flex items-center justify-center">
      <GoalOverlayWrapper streamerSlug="demigod" />
    </div>
  );
};

export default DemigodGoalOverlay;
