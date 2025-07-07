import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Play, Pause, ChevronDown, ChevronRight } from "lucide-react";

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
  onExpandChange?: (isExpanded: boolean) => void;
}

const CustomSoundSelector: React.FC<CustomSoundSelectorProps> = ({
  onSoundSelect,
  selectedSoundUrl,
  disabled,
  minAmount = 100,
  currentAmount = 0,
  onExpandChange
}) => {
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const sounds: CustomSound[] = [
    {
      id: "voicy_alert",
      name: "Voicy Alert",
      file_url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/custom-sounds/voicy_alert.mp3"
    },
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
      
      {/* Main toggle button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          const newExpanded = !isExpanded;
          setIsExpanded(newExpanded);
          onExpandChange?.(newExpanded);
        }}
        disabled={!isEligible}
        className={`w-full h-8 text-xs justify-between bg-gradient-to-r from-pink-100 to-purple-100 border-pink-400 text-pink-700 hover:from-pink-200 hover:to-purple-200 hover:border-pink-500 transition-all duration-200 ${
          !isEligible ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
        }`}
      >
        <div className="flex items-center">
          <Volume2 className="w-4 h-4 mr-2" />
          <span className="font-medium">
            {isExpanded 
              ? "Hide Custom Sound Alerts"
              : selectedSoundUrl === null 
                ? "Click here for Custom Sound Alerts" 
                : `Selected: ${sounds.find(s => s.file_url === selectedSoundUrl)?.name}`
            }
          </span>
          {!isEligible && <span className="ml-1 text-red-600">(₹{minAmount}+ required)</span>}
        </div>
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </Button>

      {/* Collapsible content */}
      {isExpanded && (
        <div className="space-y-1 mt-2 p-2 bg-black/20 rounded border border-pink-300/30">
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
                    className={`w-full h-6 text-xs justify-start ${
                      isSelected 
                        ? "bg-pink-500 text-white border-pink-400 hover:bg-pink-600" 
                        : "bg-white/95 border-pink-300 text-gray-800 hover:bg-white hover:border-pink-400"
                    }`}
                  >
                    <Volume2 className="w-3 h-3 mr-1" />
                    {sound.name}
                  </Button>
                  
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
                </div>
              );
            })}
          </div>

          <p className="text-xs text-white/80 text-center mt-2">
            Custom sound alerts play during donation messages on stream
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomSoundSelector;