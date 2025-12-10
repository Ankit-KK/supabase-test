import MediaSourcePlayer from '@/components/audio-player/MediaSourcePlayer';
import { Cat } from 'lucide-react';

const NekoXenpaiMediaSourcePlayer = () => (
  <MediaSourcePlayer
    streamerSlug="neko_xenpai"
    streamerName="Neko Xenpai"
    tableName="neko_xenpai_donations"
    browserSourcePath="/neko_xenpai/audio-player"
    brandColor="#a855f7"
    Icon={Cat}
  />
);

export default NekoXenpaiMediaSourcePlayer;