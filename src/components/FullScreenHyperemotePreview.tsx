import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Play, Pause } from "lucide-react";

interface FullScreenHyperemotePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEmoji: string;
}

const CELEBRATION_EMOTES = [
  { id: 'happy', src: '/lovable-uploads/2f07c754-6bf7-40e6-8a98-f181f991614a.png', name: 'Happy' },
  { id: 'peaceful', src: '/lovable-uploads/292d1bf8-f7af-4bf3-8540-9e79fda428c2.png', name: 'Peaceful' },
  { id: 'disappointed', src: '/lovable-uploads/a62460bb-2981-4570-8bce-51472286d43f.png', name: 'Disappointed' },
  { id: 'upset', src: '/lovable-uploads/2016b23f-1791-4159-b604-4ec5ecbf505e.png', name: 'Upset' },
  { id: 'wink', src: '/lovable-uploads/2e0cb8ea-caa0-4039-a256-b14849269d25.png', name: 'Wink' },
  { id: 'surprised', src: '/lovable-uploads/6c1ab8e8-8d6f-48bf-9111-059acae74a34.png', name: 'Surprised' },
  { id: 'excited', src: '/lovable-uploads/5459b5bb-a628-4c02-a9ca-4b374fe1fe38.png', name: 'Excited' },
  { id: 'love', src: '/lovable-uploads/33359350-7d33-4384-81d9-99fcf0220f60.png', name: 'Love' },
  { id: 'sleepy', src: '/lovable-uploads/cd661d15-1109-41d5-9908-70531edc117c.png', name: 'Sleepy' },
  { id: 'crying', src: '/lovable-uploads/2d18e120-71ab-48bf-8ead-36620a7546a8.png', name: 'Crying' },
];

interface FloatingEmoji {
  id: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  velocity: { x: number; y: number };
  rotationSpeed: number;
}

const FullScreenHyperemotePreview: React.FC<FullScreenHyperemotePreviewProps> = ({ 
  isOpen, 
  onClose, 
  selectedEmoji 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [animationId, setAnimationId] = useState<NodeJS.Timeout | null>(null);

  const selectedEmote = CELEBRATION_EMOTES.find(emote => emote.id === selectedEmoji);

  const createFloatingEmoji = (): FloatingEmoji => ({
    id: Date.now() + Math.random(),
    x: Math.random() * 100,
    y: 100,
    scale: 0.6 + Math.random() * 0.8, // Bigger for full screen
    rotation: Math.random() * 360,
    opacity: 1,
    velocity: {
      x: (Math.random() - 0.5) * 3,
      y: -1.5 - Math.random() * 3
    },
    rotationSpeed: (Math.random() - 0.5) * 6
  });

  const updateEmojis = () => {
    setFloatingEmojis(prev => {
      const updated = prev.map(emoji => ({
        ...emoji,
        x: emoji.x + emoji.velocity.x,
        y: emoji.y + emoji.velocity.y,
        rotation: emoji.rotation + emoji.rotationSpeed,
        opacity: emoji.opacity - 0.008,
        velocity: {
          ...emoji.velocity,
          y: emoji.velocity.y - 0.05
        }
      })).filter(emoji => emoji.opacity > 0 && emoji.y > -20);

      // Add new emojis more frequently for full screen
      if (Math.random() < 0.4 && updated.length < 25) {
        updated.push(createFloatingEmoji());
      }

      return updated;
    });
  };

  useEffect(() => {
    if (isOpen && isPlaying) {
      const id = setInterval(updateEmojis, 50);
      setAnimationId(id);
      
      // Big initial burst
      const initialEmojis = Array.from({ length: 15 }, createFloatingEmoji);
      setFloatingEmojis(initialEmojis);
      
      return () => clearInterval(id);
    } else {
      if (animationId) clearInterval(animationId);
      setFloatingEmojis([]);
    }
  }, [isOpen, isPlaying, selectedEmoji]);

  const toggleAnimation = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none w-screen h-screen m-0 p-0 bg-black/95 border-0">
        {/* Full screen overlay simulation */}
        <div className="relative w-full h-full overflow-hidden">
          {/* Stream background simulation */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-pink-900/30"></div>
          
          {/* Floating emojis */}
          {floatingEmojis.map((emoji) => (
            <div
              key={emoji.id}
              className="absolute pointer-events-none z-20"
              style={{
                left: `${emoji.x}%`,
                top: `${emoji.y}%`,
                transform: `scale(${emoji.scale}) rotate(${emoji.rotation}deg)`,
                opacity: emoji.opacity,
              }}
            >
              {selectedEmote && (
                <img
                  src={selectedEmote.src}
                  alt={selectedEmote.name}
                  className="w-16 h-16 object-contain drop-shadow-lg"
                />
              )}
            </div>
          ))}
          
          {/* Center celebration display */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            {isPlaying && (
              <div className="text-center">
                <div className="text-6xl font-bold mb-4 animate-pulse-glow bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  🎉 HYPEREMOTE! 🎉
                </div>
                <div className="text-2xl text-purple-200 mb-2">
                  {selectedEmote?.name} celebration!
                </div>
                <div className="text-lg text-purple-300">
                  ₹100 donation received
                </div>
              </div>
            )}
          </div>
          
          {/* Sparkle effects for full screen */}
          {isPlaying && (
            <div className="absolute inset-0 z-5">
              <div className="absolute top-10 left-10 text-4xl text-yellow-300 animate-ping">✨</div>
              <div className="absolute top-20 right-20 text-3xl text-pink-300 animate-bounce">💫</div>
              <div className="absolute bottom-32 left-1/4 text-4xl text-purple-300 animate-pulse-glow">⭐</div>
              <div className="absolute bottom-20 right-1/3 text-3xl text-blue-300 animate-ping">✨</div>
              <div className="absolute top-1/3 left-10 text-2xl text-yellow-400 animate-bounce">🌟</div>
              <div className="absolute top-1/2 right-10 text-3xl text-pink-400 animate-pulse-glow">💥</div>
            </div>
          )}
          
          {/* Controls overlay */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-30">
            <div className="bg-black/70 backdrop-blur-sm rounded-full px-6 py-3 flex items-center space-x-4">
              <Button
                onClick={toggleAnimation}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Stop Effect
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Effect
                  </>
                )}
              </Button>
              <span className="text-purple-300 text-sm">
                This is how your {selectedEmote?.name} emote appears on stream
              </span>
            </div>
          </div>
          
          {/* Close button */}
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="absolute top-6 right-6 z-30 bg-black/50 hover:bg-black/70 text-white border border-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
          
          {/* Instructions */}
          {!isPlaying && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center z-30">
              <div className="bg-black/70 backdrop-blur-sm rounded-lg p-6 max-w-md">
                <div className="mb-4">
                  {selectedEmote && (
                    <img
                      src={selectedEmote.src}
                      alt={selectedEmote.name}
                      className="w-20 h-20 object-contain mx-auto mb-3 opacity-80"
                    />
                  )}
                </div>
                <h3 className="text-purple-300 text-lg font-medium mb-2">
                  Full-Screen Hyperemote Preview
                </h3>
                <p className="text-purple-200 text-sm">
                  This is exactly how your {selectedEmote?.name} emote celebration will appear 
                  on the streamer's screen when you donate ₹100
                </p>
                <p className="text-purple-400 text-xs mt-2">
                  Click "Start Effect" to see the animation
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FullScreenHyperemotePreview;