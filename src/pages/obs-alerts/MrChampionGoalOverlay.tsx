import { GoalOverlayWrapper } from '@/components/obs/GoalOverlayWrapper';

const MrChampionGoalOverlay = () => {
  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden flex items-center justify-center">
      <GoalOverlayWrapper streamerSlug="mr_champion" />
    </div>
  );
};

export default MrChampionGoalOverlay;
