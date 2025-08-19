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
  const [emotes, setEmotes] = useState<EmoteFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmotes();
  }, []);

  const fetchEmotes = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('chiaa-emotes')
        .list('', {
          limit: 20,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) throw error;

      const emoteFiles = data
        .filter(file => file.name.match(/\.(png|jpg|jpeg|gif|webp)$/i))
        .map(file => ({
          name: file.name.replace(/\.(png|jpg|jpeg|gif|webp)$/i, ''),
          url: supabase.storage.from('chiaa-emotes').getPublicUrl(file.name).data.publicUrl
        }));

      setEmotes(emoteFiles);
      
      // Set default emote if none selected
      if (emoteFiles.length > 0 && !selectedEmoji) {
        onEmojiSelect(emoteFiles[0].name, emoteFiles[0].url);
      }
    } catch (error) {
      console.error('Error fetching emotes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

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