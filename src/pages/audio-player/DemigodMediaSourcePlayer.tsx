import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';

const DemigodMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="demigod"
    streamerName="Demigod"
    tableName="demigod_donations"
    browserSourcePath="/demigod/media-audio-player"
    brandColor="#8b5cf6"
  />
);

export default DemigodMediaSourcePlayer;
