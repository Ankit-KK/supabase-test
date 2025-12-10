import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';
import { Film } from 'lucide-react';

const BongFlickMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="bongflick"
    streamerName="BongFlick"
    tableName="bongflick_donations"
    browserSourcePath="/bongflick/audio-player"
    brandColor="#22c55e"
    Icon={Film}
  />
);

export default BongFlickMediaSourcePlayer;