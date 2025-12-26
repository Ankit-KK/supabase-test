import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Volume2, Play, Pause, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Sound {
  name: string;
  url: string;
  displayName: string;
}

interface HyperSoundSelectorProps {
  selectedSound: string | null;
  onSoundSelect: (soundUrl: string | null) => void;
}

// Clean up filename to display name
const formatSoundName = (filename: string): string => {
  return filename
    .replace(/\.mp3$/i, '')
    .replace(/-/g, ' ')
    .replace(/mp3cut/gi, '')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
};

const HyperSoundSelector: React.FC<HyperSoundSelectorProps> = ({ selectedSound, onSoundSelect }) => {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchSounds = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('list-hypersounds');

        if (error) {
          console.error('Error fetching sounds:', error);
          return;
        }

        const soundList: Sound[] = (data?.sounds || []).map((file: { name: string; url: string }) => ({
          name: file.name,
          url: file.url,
          displayName: formatSoundName(file.name)
        }));

        setSounds(soundList);
      } catch (err) {
        console.error('Error loading sounds:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSounds();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = (soundUrl: string) => {
    if (playingSound === soundUrl) {
      // Stop current sound
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingSound(null);
    } else {
      // Stop any playing sound first
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // Play new sound
      const audio = new Audio(soundUrl);
      audio.volume = 0.5;
      audio.onended = () => setPlayingSound(null);
      audio.onerror = () => setPlayingSound(null);
      audio.play();
      audioRef.current = audio;
      setPlayingSound(soundUrl);
    }
  };

  const handleSelect = (soundUrl: string) => {
    if (selectedSound === soundUrl) {
      onSoundSelect(null);
    } else {
      onSoundSelect(soundUrl);
    }
  };

  if (loading) {
    return (
      <div className="p-4 border border-orange-500/30 rounded-lg bg-orange-500/5">
        <div className="flex items-center justify-center gap-2 text-orange-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          <span className="text-sm">Loading sounds...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-orange-500">
        <Volume2 className="h-4 w-4" />
        <span className="text-sm font-medium">Select a Sound</span>
      </div>
      
      <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-1">
        {sounds.map((sound) => (
          <div
            key={sound.name}
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer",
              selectedSound === sound.url
                ? "border-orange-500 bg-orange-500/20"
                : "border-orange-500/30 hover:border-orange-500/50 bg-orange-500/5"
            )}
            onClick={() => handleSelect(sound.url)}
          >
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay(sound.url);
              }}
            >
              {playingSound === sound.url ? (
                <Pause className="h-4 w-4 text-orange-500" />
              ) : (
                <Play className="h-4 w-4 text-orange-500" />
              )}
            </Button>
            
            <span className="flex-1 text-sm truncate">{sound.displayName}</span>
            
            {selectedSound === sound.url && (
              <Check className="h-4 w-4 text-orange-500 shrink-0" />
            )}
          </div>
        ))}
      </div>
      
      {sounds.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No sounds available
        </p>
      )}
    </div>
  );
};

export default HyperSoundSelector;
