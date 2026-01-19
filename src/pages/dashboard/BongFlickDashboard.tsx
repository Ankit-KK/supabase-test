import StreamerDashboardWrapper from "@/components/dashboard/StreamerDashboardWrapper";
import { STREAMER_CONFIGS } from "@/config/streamers";

const config = STREAMER_CONFIGS.bongflick;

const BongFlickDashboard = () => {
  return (
    <StreamerDashboardWrapper
      streamerSlug={config.slug}
      streamerName={config.name}
      tableName={config.tableName}
      brandColor={config.brandColor}
    />
  );
};

export default BongFlickDashboard;
