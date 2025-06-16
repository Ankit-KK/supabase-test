
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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
  const [playingId, setPlayingId] = useState<string | null>(null);

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

  const handleSoundSelect = (sound: CustomSound) => {
    if (!isEligible) return;
    
    if (selectedSoundUrl === sound.file_url) {
      // Deselect if already selected
      onSoundSelect(null);
    } else {
      onSoundSelect(sound.file_url);
    }
  };

  const handleNoSoundSelect = () => {
    onSoundSelect(null);
  };

  const playPreview = (sound: CustomSound) => {
    if (!isEligible) return;
    
    // Stop any currently playing audio
    if (previewAudio) {
      previewAudio.pause();
      setPreviewAudio(null);
      setPlayingId(null);
    }

    const audio = new Audio(sound.file_url);
    audio.volume = 0.5;
    
    audio.addEventListener('ended', () => {
      setPlayingId(null);
      setPreviewAudio(null);
    });

    audio.play();
    setPreviewAudio(audio);
    setPlayingId(sound.id);
  };

  const stopPreview = () => {
    if (previewAudio) {
      previewAudio.pause();
      setPreviewAudio(null);
      setPlayingId(null);
    }
  };

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-white">
        Custom Sound Alert (₹{minAmount}+) {!isEligible && `- Need ₹${minAmount - currentAmount} more`}
      </label>
      
      <div className="space-y-1">
        {/* No Sound Option */}
        <Button
          type="button"
          variant={selectedSoundUrl === null ? "default" : "outline"}
          onClick={handleNoSoundSelect}
          className={`w-full h-6 text-xs justify-start ${
            selectedSoundUrl === null 
              ? "bg-pink-500 text-white border-pink-400 hover:bg-pink-600" 
              : "bg-white/95 border-pink-300 text-gray-800 hover:bg-white hover:border-pink-400"
          }`}
        >
          <VolumeX className="w-3 h-3 mr-1" />
          No sound alert
        </Button>

        {/* Sound Options */}
        <div className="grid grid-cols-2 gap-1">
          {sounds.map((sound) => {
            const isSelected = selectedSoundUrl === sound.file_url;
            const isPlaying = playingId === sound.id;
            
            return (
              <div key={sound.id} className="space-y-1">
                <Button
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => handleSoundSelect(sound)}
                  disabled={isDisabled}
                  className={`w-full h-6 text-xs justify-start ${
                    isSelected 
                      ? "bg-pink-500 text-white border-pink-400 hover:bg-pink-600" 
                      : "bg-white/95 border-pink-300 text-gray-800 hover:bg-white hover:border-pink-400"
                  } ${!isEligible ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Volume2 className="w-3 h-3 mr-1" />
                  {sound.name}
                  {!isEligible && <span className="ml-1">(₹{minAmount}+)</span>}
                </Button>
                
                {isEligible && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => isPlaying ? stopPreview() : playPreview(sound)}
                    className="w-full bg-white/20 border-pink-300/50 text-pink-100 hover:bg-white/30 text-xs h-5"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-2 h-2 mr-1" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play className="w-2 h-2 mr-1" />
                        Preview
                      </>
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-white/80 text-center">
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
