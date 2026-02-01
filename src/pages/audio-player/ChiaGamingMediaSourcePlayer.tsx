import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';
import { Gamepad2 } from 'lucide-react';

const ChiaGamingMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="chiaa_gaming"
    streamerName="Chiaa Gaming"
    tableName="chiaa_gaming_donations"
    browserSourcePath="/chiaa_gaming/audio-player"
    brandColor="#ec4899"
    Icon={Gamepad2}
  />
);

export default ChiaGamingMediaSourcePlayer;