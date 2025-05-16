
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface VideoBackgroundProps {
  videoSrc: string;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({ videoSrc }) => {
  const isMobile = useIsMobile();

  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      className="video-background"
      // On mobile, prioritize faster loading over quality
      preload={isMobile ? "metadata" : "auto"}
    >
      <source src={videoSrc} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};

export default VideoBackground;
