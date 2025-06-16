
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Volume2, Play, Pause } from "lucide-react";

interface SoundAlert {
  id: string;
  name: string;
  url: string;
}

interface CustomSoundAlertsProps {
  onSoundSelect: (sound: SoundAlert | null) => void;
  selectedSound: SoundAlert | null;
  disabled?: boolean;
  amount: string;
}

const soundAlerts: SoundAlert[] = [
  {
    id: "knock_left",
    name: "Knock Left",
    url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/sign/ankit/knock-left-ear-made-with-Voicemod.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNjE0Mzg4Ni1lZTVhLTQxZGYtYWZmMC0xNDZiYjJlYWRjYTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhbmtpdC9rbm9jay1sZWZ0LWVhci1tYWRlLXdpdGgtVm9pY2Vtb2QubXAzIiwiaWF0IjoxNzUwMTAyMjY1LCJleHAiOjE3ODE2MzgyNjV9.DcGT2DWtGaHhBXp_2wMRZqUf1CbU20c0qYjc6KSrd8w"
  },
  {
    id: "raze_ult",
    name: "Raze Ult",
    url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/sign/ankit/raze-fire-in-the-hole.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNjE0Mzg4Ni1lZTVhLTQxZGYtYWZmMC0xNDZiYjJlYWRjYTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhbmtpdC9yYXplLWZpcmUtaW4tdGhlLWhvbGUubXAzIiwiaWF0IjoxNzUwMTAyMjg0LCJleHAiOjE3ODE2MzgyODR9.OCq6GIUUZnrv7XwELWUd061_mkukaPswNEWfa8Ym-nk"
  },
  {
    id: "sova_ult",
    name: "Sova Ult",
    url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/sign/ankit/valorant-sova-made-with-Voicemod.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNjE0Mzg4Ni1lZTVhLTQxZGYtYWZmMC0xNDZiYjJlYWRjYTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhbmtpdC92YWxvcmFudC1zb3ZhLW1hZGUtd2l0aC1Wb2ljZW1vZC5tcDMiLCJpYXQiOjE3NTAxMDIzMDQsImV4cCI6MTc4MTYzODMwNH0.jO6w7EOQX26Grqam2DvKylzCLQNqbfEKtKyvjPkEu2Q"
  },
  {
    id: "spike_plant",
    name: "Spike Plant",
    url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/sign/ankit/valorant-spike-plant.mp3?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNjE0Mzg4Ni1lZTVhLTQxZGYtYWZmMC0xNDZiYjJlYWRjYTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhbmtpdC92YWxvcmFudC1zcGlrZS1wbGFudC5tcDMiLCJpYXQiOjE3NTAxMDIzMTYsImV4cCI6MTc4MTYzODMxNn0.LiWtdJaD5FeJNRWiQaYvADesOo7sXhcg_MZbpRT1gHg"
  }
];

const CustomSoundAlerts: React.FC<CustomSoundAlertsProps> = ({ 
  onSoundSelect, 
  selectedSound, 
  disabled = false,
  amount 
}) => {
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<{ [key: string]: HTMLAudioElement }>({});

  const isActive = parseFloat(amount) >= 100;

  const playSound = (sound: SoundAlert) => {
    // Stop any currently playing sound
    if (playingSound && audioElements[playingSound]) {
      audioElements[playingSound].pause();
      audioElements[playingSound].currentTime = 0;
    }

    // Create or get audio element
    let audio = audioElements[sound.id];
    if (!audio) {
      audio = new Audio(sound.url);
      setAudioElements(prev => ({ ...prev, [sound.id]: audio }));
    }

    audio.onended = () => setPlayingSound(null);
    audio.onpause = () => setPlayingSound(null);
    
    audio.play();
    setPlayingSound(sound.id);
  };

  const stopSound = () => {
    if (playingSound && audioElements[playingSound]) {
      audioElements[playingSound].pause();
      audioElements[playingSound].currentTime = 0;
      setPlayingSound(null);
    }
  };

  const handleSoundSelect = (sound: SoundAlert) => {
    if (!isActive || disabled) return;
    
    if (selectedSound?.id === sound.id) {
      onSoundSelect(null);
    } else {
      onSoundSelect(sound);
    }
  };

  return (
    <Card className={`bg-black/60 backdrop-blur-sm border-pink-400/30 ${!isActive ? 'opacity-50' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm sm:text-base flex items-center space-x-2">
          <Volume2 className="w-4 h-4 text-pink-400" />
          <span>Custom Sound Alerts</span>
          {!isActive && (
            <span className="text-xs text-pink-300/70">(₹100+ required)</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {!isActive && (
          <p className="text-xs text-white/70 mb-3">
            Donate ₹100 or more to unlock custom sound alerts that will play on stream!
          </p>
        )}
        
        <div className="grid grid-cols-2 gap-2">
          {soundAlerts.map((sound) => (
            <div key={sound.id} className="space-y-1">
              <Button
                type="button"
                variant={selectedSound?.id === sound.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleSoundSelect(sound)}
                disabled={!isActive || disabled}
                className={`w-full text-xs h-8 ${
                  selectedSound?.id === sound.id
                    ? "bg-pink-500 text-white border-pink-400"
                    : "bg-white/10 border-pink-300/50 text-white hover:bg-pink-500/20"
                } ${!isActive || disabled ? "cursor-not-allowed opacity-50" : ""}`}
              >
                {sound.name}
              </Button>
              
              {isActive && !disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => playingSound === sound.id ? stopSound() : playSound(sound)}
                  className="w-full h-6 text-xs text-pink-200 hover:text-pink-100 hover:bg-pink-500/20"
                >
                  {playingSound === sound.id ? (
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
              )}
            </div>
          ))}
        </div>

        {selectedSound && isActive && (
          <div className="mt-3 p-2 bg-pink-500/20 rounded border border-pink-300/30">
            <p className="text-xs text-white">
              Selected: <span className="font-medium text-pink-200">{selectedSound.name}</span>
            </p>
            <p className="text-xs text-white/80">
              This sound will play on stream when your donation is processed!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomSoundAlerts;
