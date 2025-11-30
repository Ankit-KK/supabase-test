import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Monitor, 
  Key, 
  Copy, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle,
  ExternalLink 
} from 'lucide-react';

interface OBSTokenManagerProps {
  streamerId: string;
  streamerSlug: string;
  brandColor?: string;
}

interface OBSToken {
  id: string;
  token: string;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
  last_used_at?: string;
}

const OBSTokenManager: React.FC<OBSTokenManagerProps> = ({
  streamerId,
  streamerSlug,
  brandColor = '#3b82f6'
}) => {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<OBSToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showToken, setShowToken] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Fetch existing tokens using database function
  useEffect(() => {
    const fetchTokens = async () => {
      if (!user) {
        console.log('No user authenticated, skipping token fetch');
        setLoading(false);
        return;
      }

      console.log('Fetching OBS tokens for streamer:', streamerId);
      
      try {
        const { data, error } = await supabase
          .rpc('get_streamer_obs_tokens', {
            p_streamer_id: streamerId,
            p_user_id: user.id
          });

        if (error) {
          console.error('Error fetching tokens:', error);
          throw error;
        }

        console.log('Successfully fetched tokens:', data);
        setTokens(data || []);
      } catch (error) {
        console.error('Error fetching OBS tokens:', error);
        toast({
          title: "Error",
          description: "Failed to load OBS tokens.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [streamerId, user]);

  const generateNewToken = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate OBS tokens.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      // Generate a random token
      const newToken = 'obs_' + Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);

      console.log('Generating OBS token for streamer:', streamerId, 'user:', user.id);

      // Use the service role approach via edge function
      const { data, error } = await supabase.functions.invoke('generate-obs-token', {
        body: {
          streamer_id: streamerId,
          new_token: newToken,
          user_email: user.email
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Token Generated",
        description: "New OBS token has been created successfully.",
      });

      // Refresh tokens list using database function with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          // Add a small delay to ensure database consistency
          await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)));
          
          const { data: updatedTokens, error: fetchError } = await supabase
            .rpc('get_streamer_obs_tokens', {
              p_streamer_id: streamerId,
              p_user_id: user.id
            });

          if (fetchError) {
            console.error(`Token fetch attempt ${retryCount + 1} failed:`, fetchError);
            if (retryCount === maxRetries - 1) throw fetchError;
            retryCount++;
            continue;
          }

          console.log('Fetched tokens after generation:', updatedTokens);
          setTokens(updatedTokens || []);
          
          // Force re-render by clearing show token state
          setShowToken(null);
          break;
          
        } catch (error) {
          if (retryCount === maxRetries - 1) {
            console.error('Failed to fetch tokens after all retries:', error);
            throw error;
          }
          retryCount++;
        }
      }

    } catch (error) {
      console.error('Error generating OBS token:', error);
      toast({
        title: "Error",
        description: "Failed to generate new OBS token. " + (error instanceof Error ? error.message : 'Unknown error'),
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, tokenId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(tokenId);
      toast({
        title: "Copied!",
        description: "Token copied to clipboard.",
      });
      
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy token to clipboard.",
        variant: "destructive",
      });
    }
  };

  const toggleTokenVisibility = (tokenId: string) => {
    setShowToken(showToken === tokenId ? null : tokenId);
  };

  const deactivateToken = async (tokenId: string) => {
    try {
      const { error } = await supabase
        .from('obs_tokens')
        .update({ is_active: false })
        .eq('id', tokenId);

      if (error) throw error;

      setTokens(tokens.map(token => 
        token.id === tokenId ? { ...token, is_active: false } : token
      ));

      toast({
        title: "Token Deactivated",
        description: "OBS token has been deactivated.",
      });
    } catch (error) {
      console.error('Error deactivating token:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate token.",
        variant: "destructive",
      });
    }
  };

  const alertsUrl = `${window.location.origin}/${streamerSlug}/obs-alerts`;

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Monitor className="h-5 w-5" />
            <span>OBS Integration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please log in to manage your OBS tokens.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Monitor className="h-5 w-5" />
            <span>OBS Integration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeToken = tokens.find(token => token.is_active);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Monitor className="h-5 w-5" />
            <span>OBS Integration</span>
          </div>
          <Button 
            onClick={generateNewToken}
            disabled={generating}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
            Generate New Token
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Setup Instructions */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Use the token below to connect OBS Browser Source to your donation alerts.
            Add a Browser Source with the alerts URL and your token parameter.
          </AlertDescription>
        </Alert>

        {/* Active Token */}
        {activeToken ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Active Token</h3>
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Token</label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={showToken === activeToken.id ? activeToken.token : '••••••••••••••••'}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleTokenVisibility(activeToken.id)}
                  >
                    {showToken === activeToken.id ? 
                      <EyeOff className="h-4 w-4" /> : 
                      <Eye className="h-4 w-4" />
                    }
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(activeToken.token, activeToken.id)}
                  >
                    {copySuccess === activeToken.id ? 
                      <CheckCircle className="h-4 w-4 text-green-600" /> :
                      <Copy className="h-4 w-4" />
                    }
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Browser Source URL</label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={`${alertsUrl}?token=${activeToken.token}`}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(
                      `${alertsUrl}?token=${activeToken.token}`,
                      `url_${activeToken.id}`
                    )}
                  >
                    {copySuccess === `url_${activeToken.id}` ? 
                      <CheckCircle className="h-4 w-4 text-green-600" /> :
                      <Copy className="h-4 w-4" />
                    }
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p className="font-medium">{new Date(activeToken.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Last Used:</span>
                <p className="font-medium">
                  {activeToken.last_used_at ? 
                    new Date(activeToken.last_used_at).toLocaleDateString() : 
                    'Never'
                  }
                </p>
              </div>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => deactivateToken(activeToken.id)}
            >
              Deactivate Token
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">No active OBS token</p>
            <Button onClick={generateNewToken} disabled={generating}>
              <Key className="h-4 w-4 mr-2" />
              Generate Your First Token
            </Button>
          </div>
        )}

        {/* OBS Setup Guide */}
        <div className="space-y-4 pt-6 border-t">
          <h3 className="font-semibold flex items-center space-x-2">
            <ExternalLink className="h-4 w-4" />
            <span>OBS Setup Guide</span>
          </h3>
          
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Open OBS Studio and add a new Browser Source</li>
            <li>Copy and paste the Browser Source URL from above</li>
            <li>Set Width: 1920, Height: 1080 (or adjust as needed)</li>
            <li>Enable "Shutdown source when not visible" and "Refresh browser when scene becomes active"</li>
            <li>Click OK to add the source</li>
            <li>Position and resize the source in your scene as desired</li>
          </ol>

          {/* Audio Player Link */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <ExternalLink className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  🎵 Voice Message Audio Player
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Open this in a separate tab/window to control voice message playback. 
                  The OBS overlay will show visual alerts only.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/${streamerSlug}/audio-player`, '_blank')}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-950/20"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Audio Player
                </Button>
              </div>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Note:</strong> Keep your OBS token private. 
              Anyone with this token can access your donation alerts. 
              Generate a new token if you suspect it has been compromised.
            </AlertDescription>
          </Alert>
        </div>

        {/* Previous Tokens */}
        {tokens.filter(token => !token.is_active).length > 0 && (
          <div className="space-y-4 pt-6 border-t">
            <h3 className="font-semibold">Previous Tokens</h3>
            <div className="space-y-2">
              {tokens.filter(token => !token.is_active).slice(0, 3).map(token => (
                <div key={token.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs">
                      {token.token.substring(0, 8)}...{token.token.slice(-4)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      Inactive
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(token.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OBSTokenManager;