import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface HyperemotePreviewProps {
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

const HyperemotePreview: React.FC<HyperemotePreviewProps> = ({ selectedEmoji }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [animationId, setAnimationId] = useState<NodeJS.Timeout | null>(null);

  const selectedEmote = CELEBRATION_EMOTES.find(emote => emote.id === selectedEmoji);

  const createFloatingEmoji = (): FloatingEmoji => ({
    id: Date.now() + Math.random(),
    x: Math.random() * 100,
    y: 100,
    scale: 0.8 + Math.random() * 0.4,
    rotation: Math.random() * 360,
    opacity: 1,
    velocity: {
      x: (Math.random() - 0.5) * 2,
      y: -2 - Math.random() * 2
    },
    rotationSpeed: (Math.random() - 0.5) * 8
  });

  const updateEmojis = () => {
    setFloatingEmojis(prev => {
      const updated = prev.map(emoji => ({
        ...emoji,
        x: emoji.x + emoji.velocity.x,
        y: emoji.y + emoji.velocity.y,
        rotation: emoji.rotation + emoji.rotationSpeed,
        opacity: emoji.opacity - 0.015,
        velocity: {
          ...emoji.velocity,
          y: emoji.velocity.y - 0.1 // gravity effect
        }
      })).filter(emoji => emoji.opacity > 0 && emoji.y > -20);

      // Add new emojis randomly
      if (Math.random() < 0.3 && updated.length < 15) {
        updated.push(createFloatingEmoji());
      }

      return updated;
    });
  };

  useEffect(() => {
    if (isPlaying) {
      const id = setInterval(updateEmojis, 50);
      setAnimationId(id);
      
      // Initial burst of emojis
      const initialEmojis = Array.from({ length: 8 }, createFloatingEmoji);
      setFloatingEmojis(initialEmojis);
      
      return () => clearInterval(id);
    } else {
      if (animationId) clearInterval(animationId);
      setFloatingEmojis([]);
    }
  }, [isPlaying, selectedEmoji]);

  const toggleAnimation = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <Card className="bg-black/50 border-purple-500/50 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-purple-200 text-sm font-medium flex items-center justify-between">
          🎬 Stream Effect Preview
          <Button
            onClick={toggleAnimation}
            size="sm"
            variant="outline"
            className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3 w-3 mr-1" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1" />
                Preview
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-32 bg-gradient-to-b from-purple-900/20 to-pink-900/20 rounded-lg border border-purple-500/30 overflow-hidden">
          {/* Stream overlay background */}
          <div className="absolute inset-0 bg-black/20"></div>
          
          {/* Floating emojis */}
          {floatingEmojis.map((emoji) => (
            <div
              key={emoji.id}
              className="absolute pointer-events-none transition-opacity duration-100"
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
                  className="w-8 h-8 object-contain"
                />
              )}
            </div>
          ))}
          
          {/* Center display */}
          <div className="absolute inset-0 flex items-center justify-center">
            {!isPlaying && selectedEmote && (
              <div className="text-center">
                <img
                  src={selectedEmote.src}
                  alt={selectedEmote.name}
                  className="w-12 h-12 object-contain mx-auto mb-2 opacity-50"
                />
                <p className="text-purple-300 text-xs">Click Preview to see effect</p>
              </div>
            )}
            
            {isPlaying && (
              <div className="text-center">
                <div className="text-purple-300 text-lg font-bold animate-pulse-glow">
                  🎉 HYPEREMOTE! 🎉
                </div>
                <div className="text-purple-200 text-sm mt-1">
                  {selectedEmote?.name} celebration!
                </div>
              </div>
            )}
          </div>
          
          {/* Sparkle effects */}
          {isPlaying && (
            <div className="absolute inset-0">
              <div className="absolute top-2 left-2 text-yellow-300 animate-ping">✨</div>
              <div className="absolute top-4 right-4 text-pink-300 animate-bounce">💫</div>
              <div className="absolute bottom-3 left-1/4 text-purple-300 animate-pulse-glow">⭐</div>
              <div className="absolute bottom-2 right-1/3 text-blue-300 animate-ping">✨</div>
            </div>
          )}
        </div>
        
        <div className="mt-3 text-center">
          <p className="text-purple-300 text-xs">
            This effect appears on stream when viewers donate ₹100 for hyperemotes
          </p>
          <p className="text-purple-400 text-xs mt-1">
            Selected: <span className="capitalize">{selectedEmoji}</span> emote
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default HyperemotePreview;