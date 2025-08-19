import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EmojiSelectorProps {
  selectedEmoji: string;
  onEmojiSelect: (emoji: string, url: string) => void;
  disabled?: boolean;
}

interface EmoteFile {
  name: string;
  url: string;
}

const EmojiSelector: React.FC<EmojiSelectorProps> = ({
  selectedEmoji,
  onEmojiSelect,
  disabled = false
}) => {
  // Static emotes from chiaa-emotes bucket
  const emotes = [
    { name: "emojis1", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/emojis1-Photoroom.png" },
    { name: "image-10", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(10).png" },
    { name: "image-1", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(1).png" },
    { name: "image-2", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(2).png" },
    { name: "image-3", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(3).png" },
    { name: "image-4", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(4).png" },
    { name: "image-5", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(5).png" },
    { name: "image-6", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(6).png" },
    { name: "image-7", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(7).png" },
    { name: "image-8", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(8).png" },
    { name: "image-9", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(9).png" },
    { name: "image", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom.png" }
  ];

  useEffect(() => {
    // Set default emote if none selected
    if (emotes.length > 0 && !selectedEmoji) {
      onEmojiSelect(emotes[0].name, emotes[0].url);
    }
  }, [selectedEmoji, onEmojiSelect]);

  return (
    <div className="grid grid-cols-3 gap-2">
      {emotes.map((emote) => (
        <button
          key={emote.name}
          type="button"
          onClick={() => onEmojiSelect(emote.name, emote.url)}
          disabled={disabled}
          className={`p-2 rounded-lg border-2 transition-all hover:scale-105 ${
            selectedEmoji === emote.name
              ? 'border-purple-500 bg-purple-500/20'
              : 'border-purple-500/30 hover:border-purple-500/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <img 
            src={emote.url} 
            alt={emote.name}
            className="w-8 h-8 object-contain mx-auto"
            loading="lazy"
          />
          <div className="text-xs text-center mt-1 text-purple-300 truncate">
            {emote.name}
          </div>
        </button>
      ))}
    </div>
  );
};

export default EmojiSelector;