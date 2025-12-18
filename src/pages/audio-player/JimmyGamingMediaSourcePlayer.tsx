import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';
import { Gamepad2 } from 'lucide-react';

const JimmyGamingMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="jimmy_gaming"
    streamerName="Jimmy Gaming"
    tableName="jimmy_gaming_donations"
    browserSourcePath="/jimmy_gaming/audio-player"
    brandColor="#22c55e"
    Icon={Gamepad2}
  />
);

export default JimmyGamingMediaSourcePlayer;
