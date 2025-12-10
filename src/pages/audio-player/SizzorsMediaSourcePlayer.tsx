import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';
import { Scissors } from 'lucide-react';

const SizzorsMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="sizzors"
    streamerName="Sizzors"
    tableName="sizzors_donations"
    browserSourcePath="/sizzors/audio-player"
    brandColor="#8b5cf6"
    Icon={Scissors}
  />
);

export default SizzorsMediaSourcePlayer;