
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";
import { useCustomSounds } from "@/hooks/useCustomSounds";

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
  const { sounds, isLoading, error } = useCustomSounds();
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const isEligible = currentAmount >= minAmount;
  const isDisabled = disabled || !isEligible;

  const selectedSound = sounds.find(sound => sound.file_url === selectedSoundUrl);

  const handleSoundSelect = (value: string) => {
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

  if (error) {
    return (
      <div className="space-y-2">
        <label className="block text-xs sm:text-sm font-medium text-white">
          Custom Sound Alert (₹{minAmount}+)
        </label>
        <p className="text-red-400 text-xs">Failed to load custom sounds</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs sm:text-sm font-medium text-white">
        Custom Sound Alert (₹{minAmount}+) {!isEligible && `- Need ₹${minAmount - currentAmount} more`}
      </label>
      
      <div className="space-y-2">
        <Select
          value={selectedSound?.id || "none"}
          onValueChange={handleSoundSelect}
          disabled={isDisabled || isLoading}
        >
          <SelectTrigger className="bg-white/95 border-pink-300 text-gray-800 focus:border-pink-500 focus:ring-pink-500/50 h-8 sm:h-9 md:h-10 text-sm disabled:opacity-50">
            <SelectValue placeholder={isLoading ? "Loading sounds..." : "Choose a sound alert"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <div className="flex items-center space-x-2">
                <VolumeX className="w-4 h-4" />
                <span>No sound alert</span>
              </div>
            </SelectItem>
            {sounds.map((sound) => (
              <SelectItem key={sound.id} value={sound.id}>
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4" />
                  <span>{sound.name}</span>
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
              className="bg-white/95 border-pink-300 text-gray-800 hover:bg-white hover:border-pink-400 text-xs"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3 h-3 mr-1" />
                  Stop Preview
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1" />
                  Preview Sound
                </>
              )}
            </Button>
            <span className="text-white/80 text-xs">Selected: {selectedSound.name}</span>
          </div>
        )}

        <p className="text-xs text-white/80">
          {isEligible 
            ? "Custom sound alerts play during your donation message on stream"
            : `Donate ₹${minAmount}+ to unlock custom sound alerts`
          }
        </p>
      </div>
    </div>
  );
};

export default CustomSoundSelector;
