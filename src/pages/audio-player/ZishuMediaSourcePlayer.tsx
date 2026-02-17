import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';

const ZishuMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="zishu"
    streamerName="Zishu"
    tableName="zishu_donations"
    browserSourcePath="/zishu/media-audio-player"
    brandColor="#a855f7"
  />
);

export default ZishuMediaSourcePlayer;
