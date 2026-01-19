import StreamerDashboardWrapper from "@/components/dashboard/StreamerDashboardWrapper";
import { STREAMER_CONFIGS } from "@/config/streamers";

const config = STREAMER_CONFIGS.damask_plays;

const DamaskPlaysDashboard = () => {
  return (
    <StreamerDashboardWrapper
      streamerSlug={config.slug}
      streamerName={config.name}
      tableName={config.tableName}
      brandColor={config.brandColor}
    />
  );
};

export default DamaskPlaysDashboard;
