import React from 'react';

interface SimpleEmojiSelectorProps {
  onEmojiSelect: (emoji: string) => void;
}

const SimpleEmojiSelector: React.FC<SimpleEmojiSelectorProps> = ({ onEmojiSelect }) => {
  const emojis = ['❤️', '🔥', '💎', '⚡', '🎉', '🚀', '💯', '👑', '🎯', '⭐', '🎮', '🎵'];

  return (
    <div className="flex flex-wrap gap-2">
      {emojis.map((emoji, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onEmojiSelect(emoji)}
          className="p-2 rounded-lg border border-slate-600 hover:border-slate-400 hover:bg-slate-700/50 transition-colors"
        >
          <span className="text-lg">{emoji}</span>
        </button>
      ))}
    </div>
  );
};

export default SimpleEmojiSelector;