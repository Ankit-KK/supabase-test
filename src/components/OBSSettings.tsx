import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Copy, RefreshCw, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateObsToken } from '@/utils/secureIdGenerator';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message?: string;
  created_at: string;
  payment_status: string;
  message_visible?: boolean;
}

interface Streamer {
  id: string;
  user_id: string;
  streamer_slug: string;
  streamer_name: string;
  brand_color: string;
  obs_token?: string;
}

interface OBSSettingsProps {
  streamer: Streamer;
  onStreamerUpdate: (updatedStreamer: Streamer) => void;
}

const OBSSettings: React.FC<OBSSettingsProps> = ({ streamer, onStreamerUpdate }) => {
  const { toast } = useToast();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [obsEnabled, setObsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);

  useEffect(() => {
    // Track Supabase auth status for clearer errors on 401
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthEmail(session?.user?.email ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const obsUrl = streamer.obs_token 
    ? `${window.location.origin}/alerts/${streamer.obs_token}`
    : '';

  // Fetch recent donations
  useEffect(() => {
    const fetchDonations = async () => {
      const { data, error } = await supabase
        .from('chia_gaming_donations')
        .select('*')
        .eq('streamer_id', streamer.id)
        .eq('payment_status', 'success')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setDonations(data);
      }
    };

    fetchDonations();

    // Real-time subscription for donation updates
    const channel = supabase
      .channel(`obs-donations-${streamer.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chia_gaming_donations',
          filter: `streamer_id=eq.${streamer.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new.payment_status === 'success') {
            setDonations(prev => [payload.new as Donation, ...prev.slice(0, 9)]);
          } else if (payload.eventType === 'UPDATE') {
            setDonations(prev => 
              prev.map(d => d.id === payload.new.id ? payload.new as Donation : d)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamer.id]);

  const handleCopyLink = async () => {
    if (!obsUrl) return;
    
    try {
      await navigator.clipboard.writeText(obsUrl);
      toast({
        title: "Copied!",
        description: "OBS alert URL copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy URL to clipboard",
        variant: "destructive",
      });
    }
  };

const handleRegenerateToken = async () => {
  setRegenerating(true);
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please log in before regenerating the OBS link (401 Unauthorized).",
        variant: "destructive",
      });
      setRegenerating(false);
      return;
    }

    // Deactivate current token
    const { error: deactivateError } = await supabase
      .from('obs_tokens')
      .update({ is_active: false })
      .eq('streamer_id', streamer.id)
      .eq('is_active', true);
    if (deactivateError) throw deactivateError;

    // Generate new token
    const newToken = generateObsToken();
    const { error: insertError } = await supabase
      .from('obs_tokens')
      .insert({
        streamer_id: streamer.id,
        token: newToken,
        is_active: true
      });

    if (insertError) throw insertError;

    const updatedStreamer = { ...streamer, obs_token: newToken };
    onStreamerUpdate(updatedStreamer);

    toast({
      title: "Token Regenerated",
      description: "New OBS alert URL generated. Old URL is now inactive.",
    });
  } catch (error: any) {
    const message = error?.message || 'Failed to regenerate token';
    toast({
      title: "Error",
      description: message.includes('JWT') || message.includes('Unauthorized') ?
        'Unauthorized (401). Please sign in again and retry.' : message,
      variant: "destructive",
    });
  }
  setRegenerating(false);
};

  const handleToggleMessageVisibility = async (donationId: string, visible: boolean) => {
    try {
      const { error } = await supabase
        .from('chia_gaming_donations')
        .update({ message_visible: visible })
        .eq('id', donationId);

      if (error) throw error;

      setDonations(prev =>
        prev.map(d => d.id === donationId ? { ...d, message_visible: visible } : d)
      );

      toast({
        title: visible ? "Message Shown" : "Message Hidden",
        description: `Donation message ${visible ? 'will be' : 'will not be'} displayed in alerts`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update message visibility",
        variant: "destructive",
      });
    }
  };

  const generateInitialToken = async () => {
    if (!streamer?.id) return;
    
    setLoading(true);
    try {
      // Check if active token exists
      const { data: activeToken, error: tokenError } = await supabase
        .from('obs_tokens')
        .select('token')
        .eq('streamer_id', streamer.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!tokenError && activeToken?.token) {
        onStreamerUpdate({ ...streamer, obs_token: activeToken.token });
        setLoading(false);
        return;
      }

      // Generate new token
      const newToken = generateObsToken();
      const { error } = await supabase
        .from('obs_tokens')
        .insert({
          streamer_id: streamer.id,
          token: newToken,
          is_active: true
        });

      if (error) throw error;

      const updatedStreamer = { ...streamer, obs_token: newToken };
      onStreamerUpdate(updatedStreamer);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate OBS token",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  // Generate token when streamer loads
  useEffect(() => {
    if (!streamer?.id) return;
    generateInitialToken();
  }, [streamer?.id]);

  return (
    <div className="space-y-6">
      {/* OBS Alert URL Section */}
      <Card>
        <CardHeader>
          <CardTitle>OBS Browser Source</CardTitle>
          <CardDescription>
            Add this URL as a browser source in OBS to show donation alerts on your stream
          </CardDescription>
          <div className="mt-2">
            <Badge variant="secondary">
              {authEmail ? `Authenticated: ${authEmail}` : 'Not signed in'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {obsUrl ? (
            <>
              <div className="flex gap-2">
                <Input 
                  value={obsUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleCopyLink}
                  title="Copy URL"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => window.open(obsUrl, '_blank')}
                  title="Preview alerts"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="obs-enabled"
                    checked={obsEnabled}
                    onCheckedChange={setObsEnabled}
                  />
                  <Label htmlFor="obs-enabled">Enable OBS Alerts</Label>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateToken}
                  disabled={regenerating || !authEmail}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
                  {authEmail ? 'Regenerate URL' : 'Sign in to regenerate'}
                </Button>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Setup Instructions:</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>In OBS, add a new "Browser Source"</li>
                  <li>Paste the URL above into the URL field</li>
                  <li>Set Width: 1920, Height: 1080</li>
                  <li>Check "Shutdown source when not visible"</li>
                  <li>Check "Refresh browser when scene becomes active"</li>
                </ol>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Generating OBS token...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Donations Management */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Donations</CardTitle>
          <CardDescription>
            Manage which donation messages appear in your OBS alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {donations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent donations to manage
            </div>
          ) : (
            <div className="space-y-3">
              {donations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{donation.name}</span>
                      <Badge 
                        variant="secondary"
                        style={{ 
                          backgroundColor: `${streamer.brand_color}20`, 
                          color: streamer.brand_color 
                        }}
                      >
                        ₹{donation.amount}
                      </Badge>
                    </div>
                    {donation.message && (
                      <p className="text-sm text-muted-foreground mt-1 truncate max-w-md">
                        {donation.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(donation.created_at).toLocaleDateString()}
                    </span>
                    {donation.message && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => 
                          handleToggleMessageVisibility(
                            donation.id, 
                            !donation.message_visible
                          )
                        }
                        title={donation.message_visible ? "Hide message" : "Show message"}
                      >
                        {donation.message_visible ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
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
  );
};

export default OBSSettings;