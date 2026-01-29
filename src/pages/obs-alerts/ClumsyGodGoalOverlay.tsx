import { GoalOverlayWrapper } from '@/components/obs/GoalOverlayWrapper';

const ClumsyGodGoalOverlay = () => {
  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden flex items-center justify-center">
      <GoalOverlayWrapper streamerSlug="clumsy_god" />
    </div>
  );
};

export default ClumsyGodGoalOverlay;
