import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';
import { Flame } from 'lucide-react';

const ClumsyGodMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="clumsygod"
    streamerName="ClumsyGod"
    tableName="clumsygod_donations"
    browserSourcePath="/clumsygod/audio-player"
    brandColor="#ef4444"
    Icon={Flame}
  />
);

export default ClumsyGodMediaSourcePlayer;