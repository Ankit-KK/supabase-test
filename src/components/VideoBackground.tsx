
import React, { useState, useRef, useEffect } from "react";

interface VideoBackgroundProps {
  videoSrc: string;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({ videoSrc }) => {
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleCanPlay = () => {
        console.log("Video can play, attempting to start playback");
        setVideoLoaded(true);
        video.play().catch(error => {
          console.error("Error playing video:", error);
        });
      };

      const handleError = (e: Event) => {
        console.error("Video error:", e);
        setVideoError(true);
      };

      const handleLoadStart = () => {
        console.log("Video loading started");
      };

      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);
      video.addEventListener('loadstart', handleLoadStart);

      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
        video.removeEventListener('loadstart', handleLoadStart);
      };
    }
  }, [videoSrc]);

  if (videoError) {
    return (
      <div className="video-background bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        {/* Fallback gradient background */}
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      className="video-background"
      style={{ opacity: videoLoaded ? 1 : 0 }}
    >
      <source src={videoSrc} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};

export default VideoBackground;
