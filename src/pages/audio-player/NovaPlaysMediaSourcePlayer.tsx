import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';

const NovaPlaysMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="nova_plays"
    streamerName="NovaPlays"
    tableName="nova_plays_donations"
    browserSourcePath="/nova_plays/media-audio-player"
    brandColor="#6366f1"
  />
);

export default NovaPlaysMediaSourcePlayer;
