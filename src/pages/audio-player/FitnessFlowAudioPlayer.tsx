import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, SkipBack, SkipForward, RefreshCw } from 'lucide-react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

const FitnessFlowAudioPlayer = () => {
  const {
    donations,
    currentDonation,
    currentIndex,
    totalDonations,
    autoPlay,
    setAutoPlay,
    loading,
    goToNext,
    goToPrevious,
    goToIndex,
    refresh
  } = useAudioPlayer({ tableName: 'fitnessflow_donations' });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-950 via-slate-900 to-orange-800">
        <div className="text-center text-white">
          <div className="animate-spin w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading voice messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-950 via-slate-900 to-orange-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Dumbbell className="h-12 w-12 text-orange-400" />
            <h1 className="text-4xl font-bold text-white">FitnessFlow Voice Messages</h1>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-400">
              {totalDonations} Messages
            </Badge>
            <Button
              onClick={refresh}
              variant="outline"
              size="sm"
              className="border-orange-500/30 text-orange-300 hover:bg-orange-500/20"
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
              className="border-orange-500/30 text-orange-300 hover:bg-orange-500/20"
            >
              <SkipBack className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={goToNext}
              variant="outline"
              className="border-orange-500/30 text-orange-300 hover:bg-orange-500/20"
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
            onAutoPlayChange={setAutoPlay}
          />
        </div>

        {/* Queue */}
        {totalDonations > 1 && (
          <Card className="max-w-4xl mx-auto bg-slate-800/50 border-orange-500/20 backdrop-blur">
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
                        ? 'bg-orange-600/30 border border-orange-500/50'
                        : 'bg-slate-700/30 hover:bg-slate-600/30 border border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-orange-300 font-medium">{donation.name}</span>
                      <Badge variant="outline" className="text-xs border-orange-400 text-orange-300">
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

export default FitnessFlowAudioPlayer;