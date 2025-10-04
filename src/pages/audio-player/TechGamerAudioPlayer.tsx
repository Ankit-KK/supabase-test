import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gamepad2, SkipBack, SkipForward, RefreshCw } from 'lucide-react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

const TechGamerAudioPlayer = () => {
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
  } = useAudioPlayer({ tableName: 'techgamer_donations' });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-800">
        <div className="text-center text-white">
          <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading voice messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gamepad2 className="h-12 w-12 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">TechGamer Voice Messages</h1>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-400">
              {totalDonations} Messages
            </Badge>
            <Button
              onClick={refresh}
              variant="outline"
              size="sm"
              className="border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Navigation */}
        {totalDonations > 1 && (
          <div className="flex justify-center gap-4 mb-8">
            <Button
              onClick={goToPrevious}
              variant="outline"
              className="border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
            >
              <SkipBack className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={goToNext}
              variant="outline"
              className="border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Next
            </Button>
          </div>
        )}

        {/* Audio Player */}
        <div className="max-w-4xl mx-auto mb-8">
          <AudioPlayer
            donation={currentDonation}
            onNext={goToNext}
            autoPlay={autoPlay}
            autoPlayEnabledAt={autoPlayEnabledAt}
            onAutoPlayChange={setAutoPlay}
          />
        </div>

        {/* Queue */}
        {totalDonations > 1 && (
          <Card className="max-w-4xl mx-auto bg-slate-800/50 border-blue-500/20 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {donations.map((donation, index) => (
                  <div
                    key={donation.id}
                    onClick={() => goToIndex(index)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      index === currentIndex
                        ? 'bg-blue-600/30 border border-blue-500/50'
                        : 'bg-slate-700/30 hover:bg-slate-600/30 border border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-blue-300 font-medium">{donation.name}</span>
                      <Badge variant="outline" className="text-xs border-blue-400 text-blue-300">
                        ₹{donation.amount}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TechGamerAudioPlayer;