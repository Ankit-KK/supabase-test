import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';
import { Gamepad2 } from 'lucide-react';

const DorpPlaysMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="dorp_plays"
    streamerName="DorpPlays"
    tableName="dorp_plays_donations"
    browserSourcePath="/dorp_plays/media-audio-player"
    brandColor="#6366f1"
    Icon={Gamepad2}
  />
);

export default DorpPlaysMediaSourcePlayer;
