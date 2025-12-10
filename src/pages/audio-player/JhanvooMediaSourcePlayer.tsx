import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';
import { Music } from 'lucide-react';

const JhanvooMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="jhanvoo"
    streamerName="Jhanvoo"
    tableName="jhanvoo_donations"
    browserSourcePath="/jhanvoo/audio-player"
    brandColor="#ec4899"
    Icon={Music}
  />
);

export default JhanvooMediaSourcePlayer;