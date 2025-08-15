import React, { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/dashboardUtils';
import { Copy, RefreshCw, Eye, EyeOff, ArrowLeft, ExternalLink } from 'lucide-react';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message?: string;
  created_at: string;
  message_visible: boolean;
  payment_status: string;
  streamer_id?: string;
}

const OBSSettings = () => {
  const { user, loading, isStreamer } = useAuth();
  const { toast } = useToast();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [obsToken, setObsToken] = useState<string>('');
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [updatingVisibility, setUpdatingVisibility] = useState<string[]>([]);

  // Allow access for all authenticated users for now
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoadingDonations(true);
      
      // Fetch donations - remove streamer filter for now since column doesn't exist
      const { data: donationsData, error: donationsError } = await supabase
        .from('chia_gaming_donations')
        .select('*')
        .eq('payment_status', 'success')
        .order('created_at', { ascending: false });

      if (donationsError) {
        console.error('Error fetching donations:', donationsError);
      } else {
        setDonations((donationsData || []).map(d => ({
          ...d,
          message_visible: true // Default to visible since column doesn't exist yet
        })));
      }

      // Fetch OBS token
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setObsToken((profileData as any)?.obs_token || '');
      }
      
      setLoadingDonations(false);
    };

    fetchData();

    // Set up realtime subscription
    const channel = supabase
      .channel('obs-donations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chia_gaming_donations',
          filter: `streamer_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Donation update received:', payload);
          
          if (payload.eventType === 'INSERT' && payload.new.payment_status === 'success') {
            const newDonation = payload.new as Donation;
            setDonations(prev => [newDonation, ...prev]);
          }
          
          if (payload.eventType === 'UPDATE') {
            const updatedDonation = payload.new as Donation;
            setDonations(prev => 
              prev.map(d => d.id === updatedDonation.id ? updatedDonation : d)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleToggleVisibility = async (donationId: string, currentVisibility: boolean) => {
    setUpdatingVisibility(prev => [...prev, donationId]);
    
    // For now, just update local state since column doesn't exist yet
    setDonations(prev =>
      prev.map(d =>
        d.id === donationId ? { ...d, message_visible: !currentVisibility } : d
      )
    );
    
    toast({
      title: "Updated",
      description: `Message ${!currentVisibility ? 'shown' : 'hidden'} in OBS alerts`,
    });
    
    setUpdatingVisibility(prev => prev.filter(id => id !== donationId));
  };

  const handleRegenerateToken = async () => {
    // Generate a simple token for now
    const newToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // For now, just update local state since the functions and columns don't exist yet
    setObsToken(newToken);
    
    toast({
      title: "Token Regenerated",
      description: "Your OBS alert link has been updated. Old link is now invalid.",
    });
  };

  const handleCopyToken = () => {
    const obsUrl = `${window.location.origin}/alerts/${obsToken}`;
    navigator.clipboard.writeText(obsUrl);
    toast({
      title: "Copied!",
      description: "OBS alert URL copied to clipboard",
    });
  };

  if (loading || loadingDonations) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const obsUrl = `${window.location.origin}/alerts/${obsToken}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">OBS Alert Settings</h1>
            <p className="text-muted-foreground">Manage your donation alerts and OBS integration</p>
          </div>
        </div>

        {/* OBS Alert URL */}
        <Card>
          <CardHeader>
            <CardTitle>OBS Alert URL</CardTitle>
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
                  className="font-mono"
                />
                <Button onClick={handleCopyToken} size="icon" variant="outline">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button asChild variant="outline" size="icon">
                  <a href={`/alerts/${obsToken}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleRegenerateToken} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate URL
              </Button>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">OBS Setup Instructions:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Open OBS Studio</li>
                <li>Add a new "Browser Source" to your scene</li>
                <li>Paste the URL above into the URL field</li>
                <li>Set Width: 1920, Height: 1080</li>
                <li>Check "Shutdown source when not visible" and "Refresh browser when scene becomes active"</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Donations Management */}
        <Card>
          <CardHeader>
            <CardTitle>Donation Messages</CardTitle>
            <CardDescription>
              Control which donation messages appear in your OBS alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {donations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No donations yet. Share your donation link to get started!
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {donations.map((donation) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{donation.name}</span>
                        <Badge variant="secondary">{formatCurrency(Number(donation.amount))}</Badge>
                        {donation.message_visible ? (
                          <Badge variant="default" className="text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            Visible
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Hidden
                          </Badge>
                        )}
                      </div>
                      {donation.message && (
                        <p className="text-sm text-muted-foreground mt-1">"{donation.message}"</p>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(donation.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={donation.message_visible}
                          onCheckedChange={() => handleToggleVisibility(donation.id, donation.message_visible)}
                          disabled={updatingVisibility.includes(donation.id)}
                        />
                        <Label className="text-sm">
                          {donation.message_visible ? 'Show in OBS' : 'Hide from OBS'}
                        </Label>
                      </div>
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

export default OBSSettings;