import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';
import { Gamepad2 } from 'lucide-react';

const LooteriyaGamingMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="looteriya_gaming"
    streamerName="Looteriya Gaming"
    tableName="looteriya_gaming_donations"
    browserSourcePath="/looteriya_gaming/audio-player"
    brandColor="#f59e0b"
    Icon={Gamepad2}
  />
);

export default LooteriyaGamingMediaSourcePlayer;
