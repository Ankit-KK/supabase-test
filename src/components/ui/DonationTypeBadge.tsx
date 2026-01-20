import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Mic, Volume2, Image as ImageIcon, Video, FileImage } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DonationType = 'text' | 'voice' | 'hypersound' | 'media';
export type MediaType = 'image' | 'gif' | 'video';

export interface DonationTypeBadgeProps {
  type: DonationType;
  mediaType?: MediaType;
  variant?: 'outline' | 'secondary' | 'default';
  size?: 'sm' | 'default';
  className?: string;
}

const getIconAndLabel = (type: DonationType, mediaType?: MediaType) => {
  switch (type) {
    case 'voice':
      return { icon: <Mic className="h-3 w-3" />, label: 'Voice Message' };
    case 'hypersound':
      return { icon: <Volume2 className="h-3 w-3" />, label: 'HyperSound' };
    case 'media':
      if (mediaType === 'video') {
        return { icon: <Video className="h-3 w-3" />, label: 'Video' };
      } else if (mediaType === 'gif') {
        return { icon: <FileImage className="h-3 w-3" />, label: 'GIF' };
      }
      return { icon: <ImageIcon className="h-3 w-3" />, label: 'Image' };
    default:
      return { icon: null, label: 'Text' };
  }
};

export const DonationTypeBadge: React.FC<DonationTypeBadgeProps> = ({
  type,
  mediaType,
  variant = 'secondary',
  size = 'default',
  className
}) => {
  const { icon, label } = getIconAndLabel(type, mediaType);

  // Don't render badge for text type
  if (type === 'text') return null;

  return (
    <Badge
      variant={variant}
      className={cn(
        'flex items-center gap-1 w-fit',
        size === 'sm' && 'text-xs px-1.5 py-0.5',
        className
      )}
    >
      {icon}
      {label}
    </Badge>
  );
};

export default DonationTypeBadge;
