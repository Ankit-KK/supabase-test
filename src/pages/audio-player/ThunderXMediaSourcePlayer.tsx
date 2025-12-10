import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';
import { Zap } from 'lucide-react';

const ThunderXMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="thunderx"
    streamerName="THUNDERX"
    tableName="thunderx_donations"
    browserSourcePath="/thunderx/audio-player"
    brandColor="#10b981"
    Icon={Zap}
  />
);

export default ThunderXMediaSourcePlayer;