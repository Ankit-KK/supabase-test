import React, { useEffect, useState } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateObsToken } from '@/utils/secureIdGenerator';
import { formatCurrency } from '@/utils/dashboardUtils';
import { 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Copy, 
  ExternalLink, 
  ArrowLeft,
  Monitor,
  Settings 
} from 'lucide-react';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message?: string;
  created_at: string;
  payment_status: string;
  streamer_id?: string;
  message_visible?: boolean;
}

interface Streamer {
  id: string;
  user_id: string;
  streamer_slug: string;
  streamer_name: string;
  brand_color: string;
  brand_logo_url?: string;
  obs_token?: string;
}

const StreamerOBSSettings = () => {
  const { user, loading } = useAuth();
  const { streamerSlug } = useParams<{ streamerSlug: string }>();
  const { toast } = useToast();
  const [streamer, setStreamer] = useState<Streamer | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [obsToken, setObsToken] = useState<string>('');
  const [updatingVisibility, setUpdatingVisibility] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);

  // Show loading while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    if (!user || !streamerSlug) return;

    const fetchData = async () => {
      setLoadingData(true);
      
      try {
        // Get streamer info
        const { data: streamerData, error: streamerError } = await supabase
          .rpc('get_streamer_by_slug', { slug: streamerSlug });

        if (streamerError || !streamerData || streamerData.length === 0) {
          console.error('Error fetching streamer:', streamerError);
          setLoadingData(false);
          return;
        }

        const streamerInfo = streamerData[0];
        setStreamer(streamerInfo);

        // Allow any authenticated user to access
        setHasAccess(true);

        // Set OBS token
        setObsToken(streamerInfo.obs_token || '');

        // If no OBS token exists, generate one
        if (!streamerInfo.obs_token) {
          const newToken = generateObsToken();
          const { error: updateError } = await supabase
            .from('streamers')
            .update({ obs_token: newToken })
            .eq('id', streamerInfo.id);

          if (!updateError) {
            setObsToken(newToken);
            setStreamer(prev => prev ? { ...prev, obs_token: newToken } : null);
          }
        }

        // Fetch donations
        const { data: donationsData, error: donationsError } = await supabase
          .from('chia_gaming_donations')
          .select('*')
          .eq('streamer_id', streamerInfo.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (donationsError) {
          console.error('Error fetching donations:', donationsError);
        } else {
          setDonations(donationsData || []);
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
      }
      
      setLoadingData(false);
    };

    fetchData();

    // Set up realtime subscription
    const channel = supabase
      .channel(`obs-donations-${streamerSlug}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chia_gaming_donations'
        },
        (payload) => {
          if (payload.new && (payload.new as any).streamer_id === streamer?.id) {
            const donation = payload.new as Donation;
            setDonations(prev => [donation, ...prev.filter(d => d.id !== donation.id)]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, streamerSlug, streamer?.id]);

  const handleToggleVisibility = async (donationId: string, currentVisibility: boolean) => {
    if (!streamer) return;
    
    setUpdatingVisibility(donationId);
    
    const { error } = await supabase
      .from('chia_gaming_donations')
      .update({ message_visible: !currentVisibility } as any)
      .eq('id', donationId)
      .eq('streamer_id', streamer.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update message visibility",
        variant: "destructive",
      });
    } else {
      setDonations(donations.map(d => 
        d.id === donationId 
          ? { ...d, message_visible: !currentVisibility }
          : d
      ));
      
      toast({
        title: "Success",
        description: `Message ${!currentVisibility ? 'shown' : 'hidden'} in OBS alerts`,
      });
    }
    
    setUpdatingVisibility(null);
  };

  const handleRegenerateToken = async () => {
    if (!streamer) return;
    
    const newToken = generateObsToken();
    
    const { error } = await supabase
      .from('streamers')
      .update({ obs_token: newToken })
      .eq('id', streamer.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate OBS token",
        variant: "destructive",
      });
    } else {
      setObsToken(newToken);
      setStreamer(prev => prev ? { ...prev, obs_token: newToken } : null);
      toast({
        title: "Success",
        description: "Your OBS alert link has been updated. Old link is now invalid.",
      });
    }
  };

  const handleCopyToken = () => {
    const obsUrl = `${window.location.origin}/alerts/${obsToken}`;
    navigator.clipboard.writeText(obsUrl);
    toast({
      title: "Copied!",
      description: "OBS alert URL copied to clipboard",
    });
  };

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!streamer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Streamer Not Found</CardTitle>
            <CardDescription>The streamer "{streamerSlug}" could not be found.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access these settings.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const obsUrl = `${window.location.origin}/alerts/${obsToken}`;

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6"
      style={{ 
        '--brand-color': streamer.brand_color,
        '--brand-color-rgb': `hsl(${streamer.brand_color?.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(' ') || '99 102 241'})` 
      } as React.CSSProperties}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/${streamerSlug}/dashboard`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{streamer.streamer_name} OBS Settings</h1>
            <p className="text-muted-foreground">Manage your donation alerts and OBS integration</p>
          </div>
        </div>

        {/* OBS Alert URL */}
        <Card style={{ borderColor: streamer.brand_color }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" style={{ color: streamer.brand_color }} />
              OBS Alert URL
            </CardTitle>
            <CardDescription>
              Add this URL as a Browser Source in OBS to display donation alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="obs-url">OBS Browser Source URL</Label>
              <div className="flex gap-2">
                <Input
                  id="obs-url"
                  value={obsUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="icon" onClick={handleCopyToken}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" asChild>
                  <a href={`/alerts/${obsToken}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleRegenerateToken} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate URL
              </Button>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">OBS Setup Instructions:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                <li>Open OBS Studio</li>
                <li>Add a new "Browser Source"</li>
                <li>Paste the URL above</li>
                <li>Set Width: 800, Height: 600</li>
                <li>Check "Shutdown source when not visible"</li>
                <li>Check "Refresh browser when scene becomes active"</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Message Visibility Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Message Visibility
            </CardTitle>
            <CardDescription>
              Control which donation messages appear in your OBS alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {donations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No donations yet. Messages will appear here once you receive donations.
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {donations.map((donation) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{donation.name}</span>
                        <Badge 
                          variant="secondary"
                          style={{ backgroundColor: `${streamer.brand_color}20`, color: streamer.brand_color }}
                        >
                          {formatCurrency(Number(donation.amount))}
                        </Badge>
                      </div>
                      {donation.message && (
                        <p className="text-sm text-muted-foreground truncate">{donation.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(donation.created_at).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Switch
                        checked={donation.message_visible !== false}
                        onCheckedChange={() => handleToggleVisibility(
                          donation.id, 
                          donation.message_visible !== false
                        )}
                        disabled={updatingVisibility === donation.id}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleVisibility(
                          donation.id, 
                          donation.message_visible !== false
                        )}
                        disabled={updatingVisibility === donation.id}
                      >
                        {donation.message_visible !== false ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                        <span className="ml-2 text-sm">
                          {donation.message_visible !== false ? 'Show in OBS' : 'Hide from OBS'}
                        </span>
                      </Button>
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

export default StreamerOBSSettings;