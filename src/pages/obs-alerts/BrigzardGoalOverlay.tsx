import { GoalOverlayWrapper } from '@/components/obs/GoalOverlayWrapper';

const BrigzardGoalOverlay = () => {
  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden flex items-center justify-center">
      <GoalOverlayWrapper streamerSlug="brigzard" />
    </div>
  );
};

export default BrigzardGoalOverlay;
