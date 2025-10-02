import { Play, Pause, SkipForward, Volume2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string | null;
}

interface TTSPlayerProps {
  currentDonation: Donation | null;
  nextDonation: Donation | null;
  isPlaying: boolean;
  queuePosition: number;
  totalInQueue: number;
  onPlay: () => void;
  onPause: () => void;
  onSkip: () => void;
}

export const TTSPlayer = ({
  currentDonation,
  nextDonation,
  isPlaying,
  queuePosition,
  totalInQueue,
  onPlay,
  onPause,
  onSkip,
}: TTSPlayerProps) => {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">TTS Queue</h3>
        <span className="text-sm text-muted-foreground">
          {queuePosition} / {totalInQueue}
        </span>
      </div>

      {currentDonation ? (
        <div className="space-y-4">
          <div className="bg-primary/10 p-4 rounded-lg space-y-2">
            <div className="text-xs text-muted-foreground">Now Playing</div>
            <div className="font-semibold text-lg">{currentDonation.name}</div>
            <div className="text-primary font-bold">₹{currentDonation.amount}</div>
            {currentDonation.message && (
              <div className="text-sm text-muted-foreground line-clamp-2">
                {currentDonation.message}
              </div>
            )}
          </div>

          {nextDonation && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="text-xs text-muted-foreground">Up Next</div>
              <div className="font-medium">{nextDonation.name}</div>
              <div className="text-sm text-primary">₹{nextDonation.amount}</div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              onClick={isPlaying ? onPause : onPlay}
              size="sm"
              variant="default"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Play
                </>
              )}
            </Button>

            <Button
              onClick={onSkip}
              size="sm"
              variant="outline"
              disabled={queuePosition >= totalInQueue}
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Skip
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>No text donations in queue</p>
          <p className="text-xs mt-2">Text donations will auto-generate TTS</p>
        </div>
      )}
    </Card>
  );
};
