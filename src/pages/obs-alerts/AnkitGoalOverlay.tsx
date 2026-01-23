import { GoalOverlayWrapper } from '@/components/obs/GoalOverlayWrapper';

const AnkitGoalOverlay = () => {
  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden flex items-center justify-center">
      <GoalOverlayWrapper streamerSlug="ankit" />
    </div>
  );
};

export default AnkitGoalOverlay;
