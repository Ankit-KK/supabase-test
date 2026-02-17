import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';

const ZishuMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="zishu"
    streamerName="Zishu"
    tableName="zishu_donations"
    browserSourcePath="/zishu/media-audio-player"
    brandColor="#e11d48"
  />
);

export default ZishuMediaSourcePlayer;
