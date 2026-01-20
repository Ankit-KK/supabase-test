import React from 'react';
import { cn } from '@/lib/utils';

export interface MediaPreviewProps {
  url: string;
  type: 'image' | 'gif' | 'video';
  maxWidth?: number;
  maxHeight?: number;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  url,
  type,
  maxWidth = 150,
  maxHeight = 100,
  controls = true,
  autoPlay = false,
  muted = true,
  loop = true,
  className
}) => {
  const containerStyle = {
    maxWidth: `${maxWidth}px`,
    maxHeight: `${maxHeight}px`
  };

  if (type === 'video') {
    return (
      <video
        src={url}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline
        className={cn(
          'w-full h-auto rounded-md object-contain',
          className
        )}
        style={containerStyle}
      />
    );
  }

  return (
    <img
      src={url}
      alt="Media preview"
      className={cn(
        'w-full h-auto rounded-md object-contain',
        className
      )}
      style={containerStyle}
    />
  );
};

export default MediaPreview;
