import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';
import { Gamepad2 } from 'lucide-react';

const ClumsyGodMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="clumsy_god"
    streamerName="Clumsy God"
    tableName="clumsy_god_donations"
    browserSourcePath="/clumsy_god/audio-player"
    brandColor="#10b981"
    Icon={Gamepad2}
  />
);

export default ClumsyGodMediaSourcePlayer;
