import StreamerDashboardWrapper from "@/components/dashboard/StreamerDashboardWrapper";
import { STREAMER_CONFIGS } from "@/config/streamers";

const config = STREAMER_CONFIGS.starlight_anya;

const StarlightAnyaDashboard = () => (
  <StreamerDashboardWrapper
    streamerSlug={config.slug}
    streamerName={config.name}
    tableName={config.tableName}
    brandColor={config.brandColor}
  />
);

export default StarlightAnyaDashboard;
