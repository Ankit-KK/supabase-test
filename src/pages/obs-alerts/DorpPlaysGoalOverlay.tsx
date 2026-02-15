import { GoalOverlayWrapper } from '@/components/obs/GoalOverlayWrapper';

const DorpPlaysGoalOverlay = () => {
  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden flex items-center justify-center">
      <GoalOverlayWrapper streamerSlug="dorp_plays" />
    </div>
  );
};

export default DorpPlaysGoalOverlay;
