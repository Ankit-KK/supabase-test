import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';
import { Music } from 'lucide-react';

const AnkitMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="ankit"
    streamerName="Ankit"
    tableName="ankit_donations"
    browserSourcePath="/ankit/audio-player"
    brandColor="#3b82f6"
    Icon={Music}
  />
);

export default AnkitMediaSourcePlayer;
