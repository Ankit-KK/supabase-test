import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';

const SlideyPlayzMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="slidey_playz"
    streamerName="Slidey Playz"
    tableName="slidey_playz_donations"
    browserSourcePath="/slidey_playz/media-audio-player"
    brandColor="#10b981"
  />
);

export default SlideyPlayzMediaSourcePlayer;
