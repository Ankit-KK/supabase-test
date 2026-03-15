import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';

const EryxMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="eryx"
    streamerName="Eryx"
    tableName="eryx_donations"
    browserSourcePath="/eryx/media-audio-player"
    brandColor="#f97316"
  />
);

export default EryxMediaSourcePlayer;
