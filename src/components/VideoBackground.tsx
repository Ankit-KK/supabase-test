
import React, { useEffect, useRef } from "react";

interface VideoBackgroundProps {
  videoSrc: string;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({ videoSrc }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoEnd = () => {
      console.log("Video ended, restarting...");
      video.currentTime = 0;
      video.play().catch(console.error);
    };

    const handleVideoError = () => {
      console.log("Video error, attempting to restart...");
      setTimeout(() => {
        video.load();
        video.play().catch(console.error);
      }, 1000);
    };

    const handleVideoStall = () => {
      console.log("Video stalled, attempting to restart...");
      video.currentTime = video.currentTime + 0.1;
      video.play().catch(console.error);
    };

    // Ensure video plays when component mounts
    const playVideo = () => {
      video.play().catch(console.error);
    };

    video.addEventListener('ended', handleVideoEnd);
    video.addEventListener('error', handleVideoError);
    video.addEventListener('stalled', handleVideoStall);
    video.addEventListener('loadeddata', playVideo);

    // Initial play attempt
    playVideo();

    return () => {
      video.removeEventListener('ended', handleVideoEnd);
      video.removeEventListener('error', handleVideoError);
      video.removeEventListener('stalled', handleVideoStall);
      video.removeEventListener('loadeddata', playVideo);
    };
  }, [videoSrc]);

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      className="video-background"
      preload="auto"
    >
      <source src={videoSrc} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};

export default VideoBackground;
