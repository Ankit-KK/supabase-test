
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EmojiSelectorProps {
  selectedEmoji: string;
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

const CELEBRATION_EMOJIS = [
  { emoji: '🎉', name: 'Party' },
  { emoji: '🔥', name: 'Fire' },
  { emoji: '⚡', name: 'Lightning' },
  { emoji: '💎', name: 'Diamond' },
  { emoji: '👑', name: 'Crown' },
  { emoji: '🚀', name: 'Rocket' },
  { emoji: '💯', name: 'Hundred' },
  { emoji: '⭐', name: 'Star' },
  { emoji: '🎊', name: 'Confetti' },
  { emoji: '🏆', name: 'Trophy' },
  { emoji: '💰', name: 'Money' },
  { emoji: '🎮', name: 'Gaming' },
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
        <div className="grid grid-cols-4 gap-2">
          {CELEBRATION_EMOJIS.map(({ emoji, name }) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onEmojiSelect(emoji)}
              disabled={disabled}
              className={`
                w-12 h-12 text-2xl rounded-lg border-2 transition-all duration-200
                hover:scale-110 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                ${selectedEmoji === emoji 
                  ? 'border-pink-400 bg-pink-500/20 shadow-pink-400/50 shadow-lg' 
                  : 'border-purple-500/30 bg-purple-500/10 hover:border-pink-400/50 hover:bg-pink-500/10'
                }
              `}
              title={name}
            >
              {emoji}
            </button>
          ))}
        </div>
        {selectedEmoji && (
          <div className="mt-3 text-center">
            <span className="text-purple-300 text-sm">
              Selected: <span className="text-xl ml-1">{selectedEmoji}</span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmojiSelector;
