import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, Eye, EyeOff, Ban, RotateCcw, Shield, Wifi, WifiOff } from 'lucide-react';
import Pusher from 'pusher-js';

interface ModerationPanelProps {
  streamerId: string;
  streamerSlug: string;
  tableName: string;
  brandColor?: string;
}

interface Donation {
  id: string;
  name: string;
  amount: number;
  message?: string;
  voice_message_url?: string;
  moderation_status: string;
  payment_status: string;
  message_visible?: boolean;
  created_at: string;
  is_donor_banned?: boolean;
  source_table?: string;
  currency?: string;
  tts_audio_url?: string;
  hypersound_url?: string;
}

interface ModerationSettings {
  moderation_mode: 'auto_approve' | 'manual';
  telegram_moderation_enabled: boolean;
}

const ModerationPanel: React.FC<ModerationPanelProps> = ({
  streamerId,
  streamerSlug,
  tableName,
  brandColor = '#3b82f6'
}) => {
  const [settings, setSettings] = useState<ModerationSettings>({
    moderation_mode: 'auto_approve',
    telegram_moderation_enabled: true
  });
  const [pendingDonations, setPendingDonations] = useState<Donation[]>([]);
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);

  // Fetch Pusher config and setup real-time connection
  useEffect(() => {
    let mounted = true;

    const setupPusher = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-pusher-config', {
          body: { streamerSlug }
        });

        if (error || !data?.key) {
          console.error('Failed to get Pusher config:', error);
          return;
        }

        // Initialize Pusher
        const pusher = new Pusher(data.key, {
          cluster: data.cluster || 'ap2',
          forceTLS: true
        });

        pusherRef.current = pusher;

        // Subscribe to dashboard channel
        const channelName = `${streamerSlug.replace(/_/g, '-')}-dashboard`;
        const channel = pusher.subscribe(channelName);
        channelRef.current = channel;

        channel.bind('pusher:subscription_succeeded', () => {
          if (mounted) {
            setIsConnected(true);
            console.log('Connected to dashboard channel:', channelName);
          }
        });

        channel.bind('pusher:subscription_error', () => {
          if (mounted) {
            setIsConnected(false);
            console.error('Failed to subscribe to dashboard channel');
          }
        });

        // Listen for donation updates
        channel.bind('donation-updated', (data: any) => {
          console.log('Donation update received:', data);
          
          if (data.action === 'approve' || data.action === 'auto_approved') {
            // Move from pending to recent
            setPendingDonations(prev => prev.filter(d => d.id !== data.id));
            setRecentDonations(prev => {
              const exists = prev.some(d => d.id === data.id);
              if (exists) return prev;
              const newDonation: Donation = {
                id: data.id,
                name: data.name,
                amount: data.amount,
                message: data.message,
                message_visible: data.message_visible !== false,
                moderation_status: 'approved',
                payment_status: 'success',
                created_at: data.created_at,
                voice_message_url: data.voice_message_url,
                currency: data.currency,
                tts_audio_url: data.tts_audio_url,
                hypersound_url: data.hypersound_url
              };
              return [newDonation, ...prev.slice(0, 9)];
            });
            setPendingCount(prev => Math.max(0, prev - 1));
          } else if (data.action === 'reject') {
            // Remove from pending
            setPendingDonations(prev => prev.filter(d => d.id !== data.id));
            setPendingCount(prev => Math.max(0, prev - 1));
          } else if (data.action === 'pending') {
            // New pending donation
            const newDonation: Donation = {
              id: data.id,
              name: data.name,
              amount: data.amount,
              message: data.message,
              message_visible: true,
              moderation_status: 'pending',
              payment_status: 'success',
              created_at: data.created_at,
              voice_message_url: data.voice_message_url,
              currency: data.currency
            };
            setPendingDonations(prev => {
              const exists = prev.some(d => d.id === data.id);
              if (exists) return prev;
              return [newDonation, ...prev];
            });
            setPendingCount(prev => prev + 1);
            
            // Show toast for new pending donation
            toast({
              title: '🔔 New Donation Pending',
              description: `₹${data.amount} from ${data.name} needs approval`
            });
          } else if (data.action === 'hide_message' || data.action === 'unhide_message') {
            // Update message visibility
            const isVisible = data.action === 'unhide_message';
            setRecentDonations(prev => 
              prev.map(d => d.id === data.id ? { ...d, message_visible: isVisible } : d)
            );
          }
        });

      } catch (err) {
        console.error('Error setting up Pusher:', err);
      }
    };

    setupPusher();

    return () => {
      mounted = false;
      if (channelRef.current) {
        channelRef.current.unbind_all();
      }
      if (pusherRef.current) {
        pusherRef.current.unsubscribe(`${streamerSlug.replace(/_/g, '-')}-dashboard`);
        pusherRef.current.disconnect();
      }
    };
  }, [streamerSlug]);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('streamers')
        .select('moderation_mode, telegram_moderation_enabled')
        .eq('id', streamerId)
        .single();

      if (!error && data) {
        const modeValue = data.moderation_mode;
        const mode: 'auto_approve' | 'manual' = modeValue === 'manual' ? 'manual' : 'auto_approve';
        setSettings({
          moderation_mode: mode,
          telegram_moderation_enabled: data.telegram_moderation_enabled ?? true
        });
      }
    };
    fetchSettings();
  }, [streamerId]);

  // Fetch moderation queue
  const fetchQueue = useCallback(async () => {
    try {
      const response = await supabase.functions.invoke('get-moderation-queue', {
        body: { streamerSlug, status: 'pending', limit: 20 }
      });

      if (response.data?.success) {
        setPendingDonations(response.data.donations || []);
        setPendingCount(response.data.pagination?.pendingCount || 0);
      }

      // Fetch recent approved
      const { data: recent } = await supabase
        .from(tableName as any)
        .select('*')
        .eq('payment_status', 'success')
        .in('moderation_status', ['approved', 'auto_approved'])
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentDonations((recent as unknown as Donation[]) || []);
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  }, [streamerSlug, tableName]);

  useEffect(() => {
    fetchQueue();
    // Reduced polling interval since we have real-time updates
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Update settings via edge function (bypasses RLS)
  const updateSettings = async (key: keyof ModerationSettings, value: any) => {
    try {
      const response = await supabase.functions.invoke('update-streamer-settings', {
        body: { streamerId, setting: key, value }
      });

      if (response.data?.success) {
        setSettings(prev => ({ ...prev, [key]: value }));
        toast({ title: 'Settings Updated', description: `${key} has been updated` });
      } else {
        throw new Error(response.data?.error || 'Failed to update settings');
      }
    } catch (error: any) {
      console.error('Settings update error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to update settings', variant: 'destructive' });
    }
  };

  // Moderate donation
  const moderateDonation = async (donationId: string, action: string) => {
    setActionLoading(donationId);
    try {
      const response = await supabase.functions.invoke('moderate-donation', {
        body: {
          action,
          donationId,
          donationTable: tableName,
          streamerId,
          moderatorName: 'Dashboard',
          source: 'dashboard'
        }
      });

      if (response.data?.success) {
        toast({ title: 'Success', description: `Donation ${action}d` });
        // Don't need to fetchQueue since Pusher will update
      } else {
        throw new Error(response.data?.error || 'Action failed');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      // Refresh on error to ensure UI is in sync
      fetchQueue();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Moderation Settings
            </div>
            <div className="flex items-center gap-2 text-sm font-normal">
              {isConnected ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Wifi className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Polling
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Moderation Mode</Label>
              <p className="text-sm text-muted-foreground">
                {settings.moderation_mode === 'manual' 
                  ? 'Donations require approval before showing on stream'
                  : 'Donations are auto-approved immediately'}
              </p>
            </div>
            <Switch
              checked={settings.moderation_mode === 'manual'}
              onCheckedChange={(checked) => updateSettings('moderation_mode', checked ? 'manual' : 'auto_approve')}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Telegram Moderation</Label>
              <p className="text-sm text-muted-foreground">Enable moderation via Telegram bot</p>
            </div>
            <Switch
              checked={settings.telegram_moderation_enabled}
              onCheckedChange={(checked) => updateSettings('telegram_moderation_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Queue Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingCount > 0 && (
              <Badge className="ml-2 bg-orange-500">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="recent">Recent Approved</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : pendingDonations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Check className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  No pending donations
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingDonations.map((donation) => (
                    <div key={donation.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-semibold">{donation.name}</span>
                          {donation.is_donor_banned && (
                            <Badge variant="destructive" className="ml-2">Banned</Badge>
                          )}
                        </div>
                        <Badge style={{ backgroundColor: brandColor }}>₹{donation.amount}</Badge>
                      </div>
                      {donation.message && (
                        <p className="text-sm text-muted-foreground mb-3">{donation.message}</p>
                      )}
                      {donation.voice_message_url && (
                        <Badge variant="secondary" className="mb-3">🎵 Voice Message</Badge>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          onClick={() => moderateDonation(donation.id, 'approve')}
                          disabled={actionLoading === donation.id}
                        >
                          <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => moderateDonation(donation.id, 'reject')}
                          disabled={actionLoading === donation.id}
                        >
                          <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                        {donation.message && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moderateDonation(donation.id, 'hide_message')}
                            disabled={actionLoading === donation.id}
                          >
                            <EyeOff className="h-4 w-4 mr-1" /> Hide Msg
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moderateDonation(donation.id, 'ban_donor')}
                          disabled={actionLoading === donation.id}
                        >
                          <Ban className="h-4 w-4 mr-1" /> Ban
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {recentDonations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No recent donations</div>
              ) : (
                <div className="space-y-3">
                  {recentDonations.map((donation) => (
                    <div key={donation.id} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <span className="font-medium">{donation.name}</span>
                        <span className="text-muted-foreground ml-2">₹{donation.amount}</span>
                        {!donation.message_visible && <Badge variant="secondary" className="ml-2">Hidden</Badge>}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moderateDonation(donation.id, donation.message_visible ? 'hide_message' : 'unhide_message')}
                        >
                          {donation.message_visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moderateDonation(donation.id, 'replay')}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ModerationPanel;
