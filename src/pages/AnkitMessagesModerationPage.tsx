import React, { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Play, CheckCircle, XCircle, Clock, Volume2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAnkitRealtime } from '@/contexts/AnkitRealtimeContext';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message?: string | null;
  voice_message_url?: string | null;
  tts_audio_url?: string | null;
  moderation_status: string;
  approved_by?: string | null;
  approved_at?: string | null;
  rejected_reason?: string | null;
  created_at: string;
  is_hyperemote?: boolean | null;
  payment_status?: string | null;
}

export const AnkitMessagesModerationPage = () => {
  const { 
    moderationDonations, 
    approveDonation, 
    rejectDonation,
    connectionStatus 
  } = useAnkitRealtime();
  
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleApprove = async (donationId: string) => {
    setProcessingId(donationId);
    try {
      await approveDonation(donationId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (donationId: string, reason?: string) => {
    setProcessingId(donationId);
    try {
      await rejectDonation(donationId, reason);
    } finally {
      setProcessingId(null);
    }
  };

  const playAudio = (url: string, donationId: string) => {
    // Stop any existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    // Toggle off if clicking the same item
    if (playingAudio === donationId) {
      setPlayingAudio(null);
      return;
    }

    // Play new audio
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingAudio(donationId);
    audio.onended = () => {
      setPlayingAudio(null);
      audioRef.current = null;
    };
    audio.play().catch(() => {
      setPlayingAudio(null);
      audioRef.current = null;
    });
  };

  const getDonationsByStatus = (status: string) => {
    return moderationDonations.filter(d => d.moderation_status === status);
  };

  const renderDonationCard = (donation: Donation) => (
    <Card key={donation.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {donation.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-shrink-0">
              <p className="font-medium text-sm">{donation.name}</p>
              <p className="text-xs text-muted-foreground">₹{donation.amount}</p>
            </div>
            <div className="flex-1 min-w-0">
              {(donation.tts_audio_url || donation.voice_message_url) ? (
                <div className="flex items-center gap-2">
                  <Volume2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    {donation.tts_audio_url ? 'Emotional TTS' : 'Voice Message'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => {
                      const url = donation.tts_audio_url || donation.voice_message_url!;
                      playAudio(url, donation.id);
                    }}
                    disabled={!donation.tts_audio_url && !donation.voice_message_url}
                  >
                    <Play className="w-3 h-3" />
                  </Button>
                </div>
              ) : donation.message ? (
                <p className="text-xs text-muted-foreground truncate">{donation.message}</p>
              ) : null}
            </div>
            <Badge 
              variant={
                donation.moderation_status === 'approved' || donation.moderation_status === 'auto_approved' ? 'default' :
                donation.moderation_status === 'rejected' ? 'destructive' : 'secondary'
              }
              className="flex-shrink-0"
            >
              {donation.moderation_status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
              {(donation.moderation_status === 'approved' || donation.moderation_status === 'auto_approved') && <CheckCircle className="w-3 h-3 mr-1" />}
              {donation.moderation_status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
              {donation.moderation_status.toUpperCase()}
            </Badge>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {format(new Date(donation.created_at), 'MMM dd, HH:mm')}
            </span>
          </div>
          
          {donation.moderation_status === 'pending' && (
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                onClick={() => handleApprove(donation.id)}
                disabled={processingId === donation.id}
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReject(donation.id)}
                disabled={processingId === donation.id}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {(donation.moderation_status === 'approved' || donation.moderation_status === 'auto_approved') && donation.approved_by && (
          <div className="text-xs text-muted-foreground mt-2">
            Approved by {donation.approved_by}
            {donation.approved_at && ` on ${format(new Date(donation.approved_at), 'MMM dd, HH:mm')}`}
          </div>
        )}

        {donation.moderation_status === 'rejected' && (
          <div className="text-xs text-muted-foreground mt-2">
            {donation.rejected_reason && (
              <p className="text-red-600">Reason: {donation.rejected_reason}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Message Moderation</h1>
              <p className="text-muted-foreground">
                Review and approve donation messages before they appear on your stream
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`
                px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2
                ${connectionStatus === 'connected' ? 'bg-green-500/20 text-green-600 border border-green-200' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500/20 text-yellow-600 border border-yellow-200' :
                  'bg-red-500/20 text-red-600 border border-red-200'}
              `}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  'bg-red-500'
                }`} />
                {connectionStatus === 'connected' ? 'Live Updates' :
                 connectionStatus === 'connecting' ? 'Connecting...' :
                 'Disconnected'}
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending ({getDonationsByStatus('pending').length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Approved ({getDonationsByStatus('approved').length + getDonationsByStatus('auto_approved').length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Rejected ({getDonationsByStatus('rejected').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <div className="space-y-4">
              {getDonationsByStatus('pending').length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Pending Donations</h3>
                    <p className="text-muted-foreground">All donations have been reviewed!</p>
                  </CardContent>
                </Card>
              ) : (
                getDonationsByStatus('pending').map(renderDonationCard)
              )}
            </div>
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            <div className="space-y-4">
              {(getDonationsByStatus('approved').length + getDonationsByStatus('auto_approved').length) === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Approved Donations</h3>
                    <p className="text-muted-foreground">Approved donations will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                [...getDonationsByStatus('approved'), ...getDonationsByStatus('auto_approved')].map(renderDonationCard)
              )}
            </div>
          </TabsContent>

          <TabsContent value="rejected" className="mt-6">
            <div className="space-y-4">
              {getDonationsByStatus('rejected').length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <XCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Rejected Donations</h3>
                    <p className="text-muted-foreground">Rejected donations will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                getDonationsByStatus('rejected').map(renderDonationCard)
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};