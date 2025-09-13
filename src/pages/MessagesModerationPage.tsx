import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Play, CheckCircle, XCircle, Clock, Volume2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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


interface Props {
  donations?: Donation[];
  onRefresh?: () => void;
  session?: {
    streamerId: string;
    streamerSlug: string;
    streamerName: string;
    brandColor: string;
    loginTime: number;
  } | null;
  tableName?: 'chia_gaming_donations' | 'ankit_donations';
  approveFunctionName?: string;
  rejectFunctionName?: string;
}

export const MessagesModerationPage = ({ donations: propDonations, onRefresh, session: propSession, tableName = 'chia_gaming_donations', approveFunctionName = 'approve-donation', rejectFunctionName = 'reject-donation' }: Props = {}) => {
  const session = propSession;
  const [donations, setDonations] = useState<Donation[]>(propDonations || []);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchDonations = async () => {
    if (!session?.streamerId) return;

    try {
      // Use the unified moderation donations function
      const { data, error } = await supabase
        .rpc('get_streamer_moderation_donations', { 
          p_streamer_id: session.streamerId
        });

      if (error) throw error;
      setDonations(data || []);
    } catch (error) {
      console.error('Error fetching donations:', error);
      toast({
        title: "Error",
        description: "Failed to load donations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update donations when prop changes
  useEffect(() => {
    if (propDonations) {
      setDonations(propDonations);
    }
  }, [propDonations]);

  useEffect(() => {
    if (!session?.streamerId) return;
    fetchDonations();
    
    // Set up real-time subscription for moderation updates
    const channel = supabase
      .channel(`moderation-${session.streamerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ankit_donations',
          filter: `streamer_id=eq.${session.streamerId}`
        },
        (payload) => {
          console.log('Ankit donation moderation update:', payload);
          fetchDonations(); // Refresh the moderation list
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chia_gaming_donations',
          filter: `streamer_id=eq.${session.streamerId}`
        },
        (payload) => {
          console.log('Chia Gaming donation moderation update:', payload);
          fetchDonations(); // Refresh the moderation list
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'demostreamer_donations',
          filter: `streamer_id=eq.${session.streamerId}`
        },
        (payload) => {
          console.log('DemoStreamer donation moderation update:', payload);
          fetchDonations(); // Refresh the moderation list
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.streamerId]);

  const handleApprove = async (donationId: string) => {
    setProcessingId(donationId);
    try {
      const { error } = await supabase.functions.invoke(approveFunctionName, {
        body: { 
          donation_id: donationId,
          streamer_session: session 
        }
      });

      if (error) throw error;

      toast({
        title: "Donation Approved",
        description: "The donation will now appear in OBS alerts",
      });
      
      fetchDonations();
      onRefresh?.();
    } catch (error) {
      console.error('Error approving donation:', error);
      toast({
        title: "Error",
        description: "Failed to approve donation",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (donationId: string, reason?: string) => {
    setProcessingId(donationId);
    try {
      const { error } = await supabase.functions.invoke(rejectFunctionName, {
        body: { 
          donation_id: donationId, 
          reason: reason || 'Inappropriate content',
          streamer_session: session
        }
      });

      if (error) throw error;

      toast({
        title: "Donation Rejected",
        description: "The donation has been rejected and will not appear in OBS",
      });
      
      fetchDonations();
      onRefresh?.();
    } catch (error) {
      console.error('Error rejecting donation:', error);
      toast({
        title: "Error",
        description: "Failed to reject donation",
        variant: "destructive",
      });
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
    return donations.filter(d => d.moderation_status === status);
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
                donation.moderation_status === 'approved' ? 'default' :
                donation.moderation_status === 'rejected' ? 'destructive' : 'secondary'
              }
              className="flex-shrink-0"
            >
              {donation.moderation_status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
              {donation.moderation_status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
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

        {donation.moderation_status === 'approved' && donation.approved_by && (
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

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please log in to access message moderation</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Message Moderation</h1>
          <p className="text-muted-foreground">
            Review and approve donation messages before they appear on your stream
          </p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending ({getDonationsByStatus('pending').length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Approved ({getDonationsByStatus('approved').length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Rejected ({getDonationsByStatus('rejected').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">Loading donations...</div>
              ) : getDonationsByStatus('pending').length === 0 ? (
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
              {getDonationsByStatus('approved').length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Approved Donations</h3>
                    <p className="text-muted-foreground">Approved donations will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                getDonationsByStatus('approved').map(renderDonationCard)
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