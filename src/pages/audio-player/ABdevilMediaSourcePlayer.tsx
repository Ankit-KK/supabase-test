import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';
import { Flame } from 'lucide-react';

const ABdevilMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="abdevil"
    streamerName="ABdevil"
    tableName="abdevil_donations"
    browserSourcePath="/abdevil/audio-player"
    brandColor="#f97316"
    Icon={Flame}
  />
);

export default ABdevilMediaSourcePlayer;