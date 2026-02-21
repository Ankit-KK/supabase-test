import StreamerDashboardWrapper from "@/components/dashboard/StreamerDashboardWrapper";
import { STREAMER_CONFIGS } from "@/config/streamers";

const config = STREAMER_CONFIGS.zishu;

const ZishuDashboard = () => {
  return (
    <StreamerDashboardWrapper
      streamerSlug={config.slug}
      streamerName={config.name}
      tableName={config.tableName}
      brandColor={config.brandColor}
      enableVoiceTranscription={true}
    />
  );
};

export default ZishuDashboard;
