import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';

const WEraMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="w_era"
    streamerName="W Era"
    tableName="w_era_donations"
    browserSourcePath="/w_era/media-audio-player"
    brandColor="#3b82f6"
  />
);

export default WEraMediaSourcePlayer;
