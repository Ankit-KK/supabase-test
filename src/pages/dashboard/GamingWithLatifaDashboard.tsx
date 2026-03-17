import StreamerDashboardWrapper from "@/components/dashboard/StreamerDashboardWrapper";
import { STREAMER_CONFIGS } from "@/config/streamers";

const config = STREAMER_CONFIGS.gaming_with_latifa;

const GamingWithLatifaDashboard = () => (
  <StreamerDashboardWrapper
    streamerSlug={config.slug}
    streamerName={config.name}
    tableName={config.tableName}
    brandColor={config.brandColor}
  />
);

export default GamingWithLatifaDashboard;
