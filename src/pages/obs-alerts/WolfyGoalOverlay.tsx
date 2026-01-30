import { GoalOverlayWrapper } from '@/components/obs/GoalOverlayWrapper';

const WolfyGoalOverlay = () => {
  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden flex items-center justify-center">
      <GoalOverlayWrapper streamerSlug="wolfy" />
    </div>
  );
};

export default WolfyGoalOverlay;
