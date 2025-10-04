import React from 'react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const AnkitAudioPlayer = () => {
  const {
    donations,
    currentDonation,
    currentIndex,
    totalDonations,
    autoPlay,
    autoPlayEnabledAt,
    setAutoPlay,
    loading,
    goToNext,
    goToPrevious,
    goToIndex,
    refresh
  } = useAudioPlayer({
    tableName: 'ankit_donations'
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading voice messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-primary">Ankit Audio Player</h1>
          <p className="text-sm text-muted-foreground">
            {totalDonations > 0 
              ? `${currentIndex + 1} of ${totalDonations} voice messages`
              : 'No voice messages available'
            }
          </p>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Navigation */}
        {totalDonations > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevious}
              disabled={totalDonations === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              disabled={totalDonations === 0}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Audio Player */}
        <AudioPlayer
          donation={currentDonation}
          onNext={goToNext}
          autoPlay={autoPlay}
          autoPlayEnabledAt={autoPlayEnabledAt}
          onAutoPlayChange={setAutoPlay}
        />

        {/* Queue */}
        {totalDonations > 1 && (
          <div className="bg-card rounded-lg p-4">
            <h3 className="font-medium mb-2">Queue ({totalDonations} messages)</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {donations.map((donation, index) => (
                <button
                  key={donation.id}
                  onClick={() => goToIndex(index)}
                  className={`w-full text-left p-2 rounded text-sm transition-colors ${
                    index === currentIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="font-medium">{donation.name}</div>
                  <div className="text-xs opacity-75">₹{donation.amount}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnkitAudioPlayer;