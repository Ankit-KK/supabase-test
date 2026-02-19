import { GoalOverlayWrapper } from '@/components/obs/GoalOverlayWrapper';

const WEraGoalOverlay = () => {
  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden flex items-center justify-center">
      <GoalOverlayWrapper streamerSlug="w_era" />
    </div>
  );
};

export default WEraGoalOverlay;
