import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VoiceMessagePlayerProps {
  url: string;
  label?: string;
  showBadge?: boolean;
  compact?: boolean;
  className?: string;
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  url,
  label = 'Voice Message',
  showBadge = true,
  compact = true,
  className
}) => {
  return (
    <div className={cn('space-y-1', className)}>
      {showBadge && (
        <Badge variant="outline" className="flex items-center gap-1 w-fit">
          <Mic className="h-3 w-3" />
          {label}
        </Badge>
      )}
      <audio
        src={url}
        controls
        className={cn(
          'w-full',
          compact ? 'h-8' : 'h-10'
        )}
      />
    </div>
  );
};

export default VoiceMessagePlayer;
