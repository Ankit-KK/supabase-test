import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';

const MrChampionMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="mr_champion"
    streamerName="Mr Champion"
    tableName="mr_champion_donations"
    browserSourcePath="/mr_champion/media-audio-player"
    brandColor="#eab308"
  />
);

export default MrChampionMediaSourcePlayer;
