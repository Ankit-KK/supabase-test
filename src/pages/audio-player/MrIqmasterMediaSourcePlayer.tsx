import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';
import { Brain } from 'lucide-react';

const MrIqmasterMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="mriqmaster"
    streamerName="Mr Iqmaster"
    tableName="mriqmaster_donations"
    browserSourcePath="/mriqmaster/audio-player"
    brandColor="#06b6d4"
    Icon={Brain}
  />
);

export default MrIqmasterMediaSourcePlayer;