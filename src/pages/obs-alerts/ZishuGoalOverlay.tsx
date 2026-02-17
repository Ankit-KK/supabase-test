import { GoalOverlayWrapper } from '@/components/obs/GoalOverlayWrapper';

const ZishuGoalOverlay = () => {
  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden flex items-center justify-center">
      <GoalOverlayWrapper streamerSlug="zishu" />
    </div>
  );
};

export default ZishuGoalOverlay;
