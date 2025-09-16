import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Copy, RefreshCw, ExternalLink, Users, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateObsToken } from '@/utils/secureIdGenerator';
import { useAnkitAuth } from '@/hooks/useAnkitAuth';

interface Streamer {
  id: string;
  streamer_slug: string;
  streamer_name: string;
  brand_color: string;
  brand_logo_url?: string;
}

interface Moderator {
  id: string;
  mod_name: string;
  telegram_user_id?: string;
  is_active: boolean;
  created_at: string;
}

interface AnkitOBSSettingsProps {
  streamer: Streamer;
  onStreamerUpdate: (updatedStreamer: Streamer) => void;
  obsToken: string;
  onTokenRegenerate: () => Promise<string>;
}

const AnkitOBSSettings: React.FC<AnkitOBSSettingsProps> = ({ streamer, onStreamerUpdate, obsToken, onTokenRegenerate }) => {
  const { toast } = useToast();
  const [obsEnabled, setObsEnabled] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const { session: streamerSession, isAuthenticated: isStreamerAuthed } = useAnkitAuth();
  
  // Moderator management state
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [newModeratorName, setNewModeratorName] = useState('');
  const [newModeratorTelegramId, setNewModeratorTelegramId] = useState('');
  const [addingModerator, setAddingModerator] = useState(false);

  const obsUrl = obsToken 
    ? `${window.location.origin}/ankit-alerts/${obsToken}`
    : '';

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
      await onTokenRegenerate();
      toast({
        title: "Token Regenerated",
        description: "New OBS alert URL generated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || 'Failed to regenerate token',
        variant: "destructive",
      });
    }
    setRegenerating(false);
  };

  // Token is now managed by parent component - no need to generate here

  // Fetch moderators
  const fetchModerators = async () => {
    try {
      const { data, error } = await supabase
        .from('streamers_moderators')
        .select('*')
        .eq('streamer_id', streamer.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setModerators(data);
      }
    } catch (error) {
      console.error('Error fetching moderators:', error);
    }
  };

  // Add new moderator
  const addModerator = async () => {
    if (!newModeratorName.trim() || !newModeratorTelegramId.trim()) {
      toast({
        title: "Error",
        description: "Please enter both name and Telegram User ID",
        variant: "destructive",
      });
      return;
    }

    setAddingModerator(true);
    try {
      const { data, error } = await supabase
        .from('streamers_moderators')
        .insert({
          streamer_id: streamer.id,
          mod_name: newModeratorName.trim(),
          telegram_user_id: newModeratorTelegramId.trim(),
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setModerators(prev => [data, ...prev]);
        setNewModeratorName('');
        setNewModeratorTelegramId('');
        
        toast({
          title: "Moderator Added",
          description: `${newModeratorName} has been added as a moderator`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add moderator",
        variant: "destructive",
      });
    }
    setAddingModerator(false);
  };

  // Remove moderator
  const removeModerator = async (moderatorId: string, moderatorName: string) => {
    try {
      const { error } = await supabase
        .from('streamers_moderators')
        .update({ is_active: false })
        .eq('id', moderatorId);

      if (error) throw error;

      setModerators(prev => prev.filter(m => m.id !== moderatorId));
      
      toast({
        title: "Moderator Removed",
        description: `${moderatorName} has been removed as a moderator`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove moderator",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!streamer?.id) return;
    fetchModerators();
  }, [streamer.id]); // Use stable string value instead of object reference

  return (
    <div className="space-y-6">
      {/* OBS Alert URL Section */}
      <Card>
        <CardHeader>
          <CardTitle>OBS Browser Source</CardTitle>
          <CardDescription>
            Add this URL as a browser source in OBS to show donation alerts on your stream
          </CardDescription>
          {isStreamerAuthed && (
            <div className="mt-2">
              <Badge variant="secondary">
                Logged in as {streamer.streamer_name}
              </Badge>
            </div>
          )}
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
                  disabled={regenerating}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
                  Regenerate URL
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
              <p className="text-sm text-muted-foreground">Loading OBS token...</p>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Telegram Moderator Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Telegram Moderators
          </CardTitle>
          <CardDescription>
            Manage who can approve/reject donations via Telegram bot. Moderators need to message the bot first with /start.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Moderator */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h4 className="font-medium mb-3">Add New Moderator</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Moderator Name"
                value={newModeratorName}
                onChange={(e) => setNewModeratorName(e.target.value)}
              />
              <Input
                placeholder="Telegram User ID (numbers only)"
                value={newModeratorTelegramId}
                onChange={(e) => setNewModeratorTelegramId(e.target.value)}
                pattern="[0-9]*"
              />
              <Button 
                onClick={addModerator}
                disabled={addingModerator}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {addingModerator ? 'Adding...' : 'Add Moderator'}
              </Button>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              <p><strong>How to get Telegram User ID:</strong></p>
              <ol className="list-decimal list-inside space-y-1 mt-1">
                <li>Ask the moderator to message your Telegram bot with /start</li>
                <li>Ask them to message @userinfobot to get their User ID</li>
                <li>Enter the numeric User ID above (e.g., 123456789)</li>
              </ol>
            </div>
          </div>

          {/* Current Moderators */}
          <div>
            <h4 className="font-medium mb-3">Current Moderators ({moderators.length})</h4>
            {moderators.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground border rounded-lg">
                No moderators added yet. Add your first moderator above.
              </div>
            ) : (
              <div className="space-y-2">
                {moderators.map((moderator) => (
                  <div
                    key={moderator.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{moderator.mod_name}</span>
                        <Badge variant="outline">
                          ID: {moderator.telegram_user_id || 'N/A'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(moderator.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeModerator(moderator.id, moderator.mod_name)}
                      className="text-destructive hover:text-destructive"
                      title="Remove moderator"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bot Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">Telegram Bot Instructions</h4>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <p><strong>For Moderators:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Message the bot with <code>/start</code> to activate</li>
                <li>Use <code>/pending</code> to see donations awaiting approval</li>
                <li>Click "Approve" or "Reject" buttons to moderate donations</li>
              </ul>
              <p className="mt-3"><strong>Bot Commands:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><code>/start</code> - Start interacting with the bot</li>
                <li><code>/pending</code> - View pending donations for moderation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnkitOBSSettings;