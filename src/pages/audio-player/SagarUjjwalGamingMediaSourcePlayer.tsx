import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';
import { Gamepad2 } from 'lucide-react';

const SagarUjjwalGamingMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="sagarujjwalgaming"
    streamerName="SAGAR UJJWAL GAMING"
    tableName="sagarujjwalgaming_donations"
    browserSourcePath="/sagarujjwalgaming/audio-player"
    brandColor="#3b82f6"
    Icon={Gamepad2}
  />
);

export default SagarUjjwalGamingMediaSourcePlayer;