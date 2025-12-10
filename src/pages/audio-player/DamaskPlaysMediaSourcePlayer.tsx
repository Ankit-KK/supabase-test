import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';
import { Sword } from 'lucide-react';

const DamaskPlaysMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="damask_plays"
    streamerName="Damask Plays"
    tableName="damask_plays_donations"
    browserSourcePath="/damask_plays/audio-player"
    brandColor="#ef4444"
    Icon={Sword}
  />
);

export default DamaskPlaysMediaSourcePlayer;