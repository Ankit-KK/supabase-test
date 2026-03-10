import { GoalOverlayWrapper } from '@/components/obs/GoalOverlayWrapper';

const NovaPlaysGoalOverlay = () => (
  <div className="w-screen h-screen bg-transparent overflow-hidden flex items-center justify-center">
    <GoalOverlayWrapper streamerSlug="nova_plays" />
  </div>
);

export default NovaPlaysGoalOverlay;
