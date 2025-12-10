import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';
import { Crown } from 'lucide-react';

const NotYourKweenMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="notyourkween"
    streamerName="not your Kween"
    tableName="notyourkween_donations"
    browserSourcePath="/notyourkween/audio-player"
    brandColor="#f472b6"
    Icon={Crown}
  />
);

export default NotYourKweenMediaSourcePlayer;