import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';

const StarlightAnyaMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="starlight_anya"
    streamerName="Starlight Anya"
    tableName="starlight_anya_donations"
    browserSourcePath="/starlight_anya/media-audio-player"
    brandColor="#e879f9"
  />
);

export default StarlightAnyaMediaSourcePlayer;
