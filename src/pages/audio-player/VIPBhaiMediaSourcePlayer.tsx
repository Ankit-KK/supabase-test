import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';
import { Crown } from 'lucide-react';

const VIPBhaiMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="vipbhai"
    streamerName="VIP BHAI"
    tableName="vipbhai_donations"
    browserSourcePath="/vipbhai/audio-player"
    brandColor="#f59e0b"
    Icon={Crown}
  />
);

export default VIPBhaiMediaSourcePlayer;