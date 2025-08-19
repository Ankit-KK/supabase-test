
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EmojiSelectorProps {
  selectedEmoji: string;
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
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

const EmojiSelector: React.FC<EmojiSelectorProps> = ({ 
  selectedEmoji, 
  onEmojiSelect, 
  disabled = false 
}) => {
  return (
    <Card className="bg-black/50 border-purple-500/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-purple-200 text-sm font-medium">
          Choose Your Celebration Emoji
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-3">
          {CELEBRATION_EMOTES.map(({ id, src, name }) => (
            <button
              key={id}
              type="button"
              onClick={() => onEmojiSelect(id)}
              disabled={disabled}
              className={`
                w-16 h-16 p-2 rounded-lg border-2 transition-all duration-200
                hover:scale-110 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center
                ${selectedEmoji === id 
                  ? 'border-pink-400 bg-pink-500/20 shadow-pink-400/50 shadow-lg' 
                  : 'border-purple-500/30 bg-purple-500/10 hover:border-pink-400/50 hover:bg-pink-500/10'
                }
              `}
              title={name}
            >
              <img 
                src={src} 
                alt={name} 
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.log(`Failed to load emote: ${name}`);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </button>
          ))}
        </div>
        {selectedEmoji && (
          <div className="mt-3 text-center">
            <span className="text-purple-300 text-sm">
              Selected: <span className="capitalize ml-1">{selectedEmoji}</span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmojiSelector;
