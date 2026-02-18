import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';

const BrigzardMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="brigzard"
    streamerName="BRIGZARD"
    tableName="brigzard_donations"
    browserSourcePath="/brigzard/media-audio-player"
    brandColor="#4a5c3e"
  />
);

export default BrigzardMediaSourcePlayer;
