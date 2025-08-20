import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Volume2, VolumeX, Play, Pause, SkipForward } from 'lucide-react';

interface VoiceDonation {
  id: string;
  name: string;
  amount: number;
  message?: string;
  voice_message_url?: string;
  created_at: string;
  payment_status: string;
  played?: boolean;
}

interface Streamer {
  id: string;
  user_id: string;
  streamer_slug: string;
  streamer_name: string;
  brand_color: string;
  obs_token: string;
}

const VoiceAlerts = () => {
  const { token: pathToken } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const obsToken = (pathToken && pathToken !== 'undefined' && pathToken !== 'null')
    ? pathToken
    : (searchParams.get('token') || searchParams.get('t') || '');

  const [streamer, setStreamer] = useState<Streamer | null>(null);
  const [voiceDonations, setVoiceDonations] = useState<VoiceDonation[]>([]);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playedDonations, setPlayedDonations] = useState<Set<string>>(new Set());

  // Validate OBS token and fetch streamer
  useEffect(() => {
    if (!obsToken) {
      setIsValidToken(false);
      return;
    }

    const validateToken = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_streamer_by_obs_token_v2', { token: obsToken });

        if (error || !data) {
          setIsValidToken(false);
          return;
        }
        
        const rows = Array.isArray(data) ? data : (data ? [data] : []);
        if (!rows || rows.length === 0) {
          setIsValidToken(false);
          return;
        }

        setStreamer(rows[0]);
        setIsValidToken(true);
      } catch (error) {
        setIsValidToken(false);
      }
    };

    validateToken();
  }, [obsToken]);

  // Fetch voice donations
  useEffect(() => {
    if (!streamer?.id) return;

    const fetchVoiceDonations = async () => {
      const { data, error } = await supabase
        .from('chia_gaming_donations')
        .select('*')
        .eq('streamer_id', streamer.id)
        .eq('payment_status', 'success')
        .not('voice_message_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setVoiceDonations(data);
      }
    };

    fetchVoiceDonations();

    // Real-time subscription for new voice donations
    const channel = supabase
      .channel(`voice-alerts-${streamer.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chia_gaming_donations',
          filter: `streamer_id=eq.${streamer.id}`
        },
        (payload) => {
          console.log('Voice donation update:', payload);
          const donation = payload.new as VoiceDonation;

          if (payload.eventType === 'INSERT') {
            if (donation.payment_status === 'success' && donation.voice_message_url) {
              setVoiceDonations(prev => [donation, ...prev.slice(0, 49)]);
              if (autoPlay && !currentlyPlaying) {
                playVoiceMessage(donation);
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            // If a pending donation gets its voice URL and success status later
            if (donation.payment_status === 'success' && donation.voice_message_url) {
              setVoiceDonations(prev => {
                const exists = prev.some(d => d.id === donation.id);
                return exists ? prev.map(d => d.id === donation.id ? donation : d) : [donation, ...prev.slice(0, 49)];
              });
              if (autoPlay && !currentlyPlaying) {
                playVoiceMessage(donation);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamer?.id, autoPlay, currentlyPlaying]);

  const playVoiceMessage = (donation: VoiceDonation) => {
    if (!donation.voice_message_url || isMuted) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    audioRef.current = new Audio(donation.voice_message_url);
    audioRef.current.volume = isMuted ? 0 : 1;
    
    audioRef.current.onplay = () => {
      setCurrentlyPlaying(donation.id);
      setIsPlaying(true);
      console.log(`Playing voice message from ${donation.name}`);
    };

    audioRef.current.onended = () => {
      setCurrentlyPlaying(null);
      setIsPlaying(false);
      setPlayedDonations(prev => new Set([...prev, donation.id]));
      
      // Auto-play next unplayed donation if enabled
      if (autoPlay) {
        const nextUnplayed = voiceDonations.find(d => 
          d.voice_message_url && 
          !playedDonations.has(d.id) && 
          d.id !== donation.id
        );
        if (nextUnplayed) {
          setTimeout(() => playVoiceMessage(nextUnplayed), 1000);
        }
      }
    };

    audioRef.current.onerror = () => {
      console.error(`Failed to play voice message from ${donation.name}`);
      setCurrentlyPlaying(null);
      setIsPlaying(false);
    };

    audioRef.current.play().catch(error => {
      console.error('Error playing audio:', error);
      setCurrentlyPlaying(null);
      setIsPlaying(false);
    });
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resumeAudio = () => {
    if (audioRef.current && currentlyPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const skipCurrent = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setCurrentlyPlaying(null);
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 1 : 0;
    }
  };

  const markAsPlayed = (donationId: string) => {
    setPlayedDonations(prev => new Set([...prev, donationId]));
  };

  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Invalid OBS Token</h1>
          <p className="text-muted-foreground">Please check your voice alerts URL</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Voice Message Alerts</h1>
          <p className="text-muted-foreground">
            Audio player for {streamer?.streamer_name}'s voice message donations
          </p>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Audio Controls</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Button
              variant={isPlaying ? "secondary" : "default"}
              onClick={isPlaying ? pauseAudio : resumeAudio}
              disabled={!currentlyPlaying}
            >
              {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isPlaying ? 'Pause' : 'Resume'}
            </Button>

            <Button
              variant="outline"
              onClick={skipCurrent}
              disabled={!currentlyPlaying}
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Skip
            </Button>

            <Button
              variant={isMuted ? "destructive" : "outline"}
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoplay"
                checked={autoPlay}
                onChange={(e) => setAutoPlay(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="autoplay" className="text-sm">Auto-play new messages</label>
            </div>
          </CardContent>
        </Card>

        {/* Voice Donations List */}
        <Card>
          <CardHeader>
            <CardTitle>Voice Messages ({voiceDonations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {voiceDonations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Volume2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No voice message donations yet</p>
                <p className="text-sm">Voice messages will appear here when donors send them</p>
              </div>
            ) : (
              <div className="space-y-3">
                {voiceDonations.map((donation) => (
                  <div
                    key={donation.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                      currentlyPlaying === donation.id ? 'border-primary bg-primary/5' : 'border-border'
                    } ${playedDonations.has(donation.id) ? 'opacity-60' : ''}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{donation.name}</span>
                        <Badge 
                          variant="secondary"
                          style={{ 
                            backgroundColor: `${streamer?.brand_color}20`, 
                            color: streamer?.brand_color 
                          }}
                        >
                          ₹{donation.amount}
                        </Badge>
                        {currentlyPlaying === donation.id && (
                          <Badge variant="default" className="animate-pulse">
                            Playing...
                          </Badge>
                        )}
                        {playedDonations.has(donation.id) && (
                          <Badge variant="outline">
                            Played
                          </Badge>
                        )}
                      </div>
                      {donation.message && (
                        <p className="text-sm text-muted-foreground mb-2">
                          "{donation.message}"
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(donation.created_at).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => playVoiceMessage(donation)}
                        disabled={currentlyPlaying === donation.id || isMuted}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Play
                      </Button>
                      {!playedDonations.has(donation.id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsPlayed(donation.id)}
                        >
                          Mark Played
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VoiceAlerts;