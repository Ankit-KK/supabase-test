import StreamerDashboardWrapper from "@/components/dashboard/StreamerDashboardWrapper";
import { STREAMER_CONFIGS } from "@/config/streamers";

const config = STREAMER_CONFIGS.nova_plays;

const NovaPlaysDashboard = () => (
  <StreamerDashboardWrapper
    streamerSlug={config.slug}
    streamerName={config.name}
    tableName={config.tableName}
    brandColor={config.brandColor}
  />
);

export default NovaPlaysDashboard;
