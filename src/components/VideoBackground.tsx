
import React from "react";

interface VideoBackgroundProps {
  videoSrc: string;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({ videoSrc }) => {
  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      className="video-background"
    >
      <source src={videoSrc} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};

export default VideoBackground;
