
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";

interface CustomSound {
  id: string;
  name: string;
  file_url: string;
}

interface CustomSoundSelectorProps {
  onSoundSelect: (soundUrl: string | null) => void;
  selectedSoundUrl: string | null;
  disabled?: boolean;
  minAmount?: number;
  currentAmount?: number;
}

const CustomSoundSelector: React.FC<CustomSoundSelectorProps> = ({
  onSoundSelect,
  selectedSoundUrl,
  disabled,
  minAmount = 100,
  currentAmount = 0
}) => {
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // All 4 sound options - always visible
  const sounds: CustomSound[] = [
    {
      id: "knock_left",
      name: "Knock left",
      file_url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/custom-sounds/knock-left-ear-made-with-Voicemod.mp3"
    },
    {
      id: "raze_ult",
      name: "Raze ult",
      file_url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/custom-sounds/raze-fire-in-the-hole.mp3"
    },
    {
      id: "sova_ult",
      name: "Sova ult",
      file_url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/custom-sounds/valorant-sova-made-with-Voicemod.mp3"
    },
    {
      id: "spike_plant",
      name: "Spike plant",
      file_url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/custom-sounds/valorant-spike-plant.mp3"
    }
  ];

  const isEligible = currentAmount >= minAmount;
  const isDisabled = disabled || !isEligible;

  const selectedSound = sounds.find(sound => sound.file_url === selectedSoundUrl);

  const handleSoundSelect = (value: string) => {
    if (!isEligible) {
      return;
    }
    
    if (value === "none") {
      onSoundSelect(null);
    } else {
      const sound = sounds.find(s => s.id === value);
      if (sound) {
        onSoundSelect(sound.file_url);
      }
    }
  };

  const playPreview = (fileUrl: string) => {
    if (!isEligible) return;
    
    if (previewAudio) {
      previewAudio.pause();
      setPreviewAudio(null);
      setIsPlaying(false);
    }

    const audio = new Audio(fileUrl);
    audio.volume = 0.5;
    
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setPreviewAudio(null);
    });

    audio.play();
    setPreviewAudio(audio);
    setIsPlaying(true);
  };

  const stopPreview = () => {
    if (previewAudio) {
      previewAudio.pause();
      setPreviewAudio(null);
      setIsPlaying(false);
    }
  };

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-white">
        Custom Sound Alert (₹{minAmount}+) {!isEligible && `- Need ₹${minAmount - currentAmount} more`}
      </label>
      
      <div className="space-y-1">
        <Select
          value={selectedSound?.id || "none"}
          onValueChange={handleSoundSelect}
          disabled={isDisabled}
        >
          <SelectTrigger className="bg-white/95 border-pink-300 text-gray-800 focus:border-pink-500 focus:ring-pink-500/50 h-7 text-xs disabled:opacity-50">
            <SelectValue placeholder={isEligible ? "Choose a sound alert" : `Donate ₹${minAmount}+ to unlock`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <div className="flex items-center space-x-2">
                <VolumeX className="w-3 h-3" />
                <span className="text-xs">No sound alert</span>
              </div>
            </SelectItem>
            {sounds.map((sound) => (
              <SelectItem key={sound.id} value={sound.id} disabled={!isEligible}>
                <div className={`flex items-center space-x-2 ${!isEligible ? 'opacity-50' : ''}`}>
                  <Volume2 className="w-3 h-3" />
                  <span className="text-xs">{sound.name}</span>
                  {!isEligible && <span className="text-xs">(₹{minAmount}+)</span>}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedSound && isEligible && (
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => isPlaying ? stopPreview() : playPreview(selectedSound.file_url)}
              className="bg-white/95 border-pink-300 text-gray-800 hover:bg-white hover:border-pink-400 text-xs h-6"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3 h-3 mr-1" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1" />
                  Preview
                </>
              )}
            </Button>
            <span className="text-white/80 text-xs">Selected: {selectedSound.name}</span>
          </div>
        )}

        <p className="text-xs text-white/80">
          {isEligible 
            ? "Custom sound alerts play during donation messages on stream"
            : `Donate ₹${minAmount}+ to unlock custom sound alerts`
          }
        </p>
      </div>
    </div>
  );
};

export default CustomSoundSelector;
