import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';
import { Dog } from 'lucide-react';

const WolfyMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="wolfy"
    streamerName="Wolfy"
    tableName="wolfy_donations"
    browserSourcePath="/wolfy/media-audio-player"
    brandColor="#f59e0b"
    Icon={Dog}
  />
);

export default WolfyMediaSourcePlayer;
