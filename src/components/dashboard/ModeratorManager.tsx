import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, UserPlus, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Moderator {
  id: string;
  telegram_user_id: string;
  mod_name: string;
  is_active: boolean;
  created_at: string;
}

interface ModeratorManagerProps {
  streamerId: string;
}

export const ModeratorManager: React.FC<ModeratorManagerProps> = ({ streamerId }) => {
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newModeratorName, setNewModeratorName] = useState('');
  const [newTelegramId, setNewTelegramId] = useState('');
  const [setupStatus, setSetupStatus] = useState<'idle' | 'setting-up' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  useEffect(() => {
    fetchModerators();
  }, [streamerId]);

  const fetchModerators = async () => {
    try {
      const { data, error } = await supabase
        .from('streamers_moderators')
        .select('*')
        .eq('streamer_id', streamerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setModerators(data || []);
    } catch (error) {
      console.error('Error fetching moderators:', error);
      toast({
        title: "Error",
        description: "Failed to fetch moderators",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addModerator = async () => {
    if (!newModeratorName.trim() || !newTelegramId.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setAdding(true);
    try {
      const { data, error } = await supabase
        .from('streamers_moderators')
        .insert({
          streamer_id: streamerId,
          telegram_user_id: newTelegramId.trim(),
          mod_name: newModeratorName.trim()
        })
        .select()
        .single();

      if (error) throw error;

      setModerators(prev => [data, ...prev]);
      setNewModeratorName('');
      setNewTelegramId('');
      
      toast({
        title: "Success",
        description: "Moderator added successfully"
      });
    } catch (error: any) {
      console.error('Error adding moderator:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add moderator",
        variant: "destructive"
      });
    } finally {
      setAdding(false);
    }
  };

  const removeModerator = async (moderatorId: string) => {
    try {
      const { error } = await supabase
        .from('streamers_moderators')
        .update({ is_active: false })
        .eq('id', moderatorId);

      if (error) throw error;

      setModerators(prev => 
        prev.map(mod => 
          mod.id === moderatorId ? { ...mod, is_active: false } : mod
        )
      );

      toast({
        title: "Success",
        description: "Moderator removed successfully"
      });
    } catch (error) {
      console.error('Error removing moderator:', error);
      toast({
        title: "Error",
        description: "Failed to remove moderator",
        variant: "destructive"
      });
    }
  };

  const setupTelegramWebhook = async () => {
    setSetupStatus('setting-up');
    try {
      const { data, error } = await supabase.functions.invoke('setup-telegram-webhook');
      
      if (error) throw error;

      if (data.success) {
        setSetupStatus('success');
        toast({
          title: "Success",
          description: "Telegram webhook configured successfully"
        });
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Error setting up webhook:', error);
      setSetupStatus('error');
      toast({
        title: "Error",
        description: error.message || "Failed to setup Telegram webhook",
        variant: "destructive"
      });
    }
  };

  const activeModerators = moderators.filter(mod => mod.is_active);

  return (
    <div className="space-y-6">
      {/* Telegram Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Telegram Bot Setup
          </CardTitle>
          <CardDescription>
            Configure the Telegram bot to receive donation notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={setupTelegramWebhook}
            disabled={setupStatus === 'setting-up'}
            variant={setupStatus === 'success' ? 'outline' : 'default'}
          >
            {setupStatus === 'setting-up' && 'Setting up...'}
            {setupStatus === 'success' && 'Webhook Configured ✓'}
            {setupStatus === 'error' && 'Setup Failed - Retry'}
            {setupStatus === 'idle' && 'Setup Telegram Webhook'}
          </Button>
          
          {setupStatus === 'success' && (
            <p className="text-sm text-muted-foreground mt-2">
              Bot is ready! Your moderators can now approve donations via Telegram.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Moderator Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Telegram Moderators
          </CardTitle>
          <CardDescription>
            Add moderators who can approve donations via Telegram bot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Moderator Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="moderator-name">Moderator Name</Label>
              <Input
                id="moderator-name"
                placeholder="Enter name"
                value={newModeratorName}
                onChange={(e) => setNewModeratorName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="telegram-id">Telegram User ID</Label>
              <Input
                id="telegram-id"
                placeholder="Enter Telegram ID"
                value={newTelegramId}
                onChange={(e) => setNewTelegramId(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={addModerator}
                disabled={adding || !newModeratorName.trim() || !newTelegramId.trim()}
                className="w-full"
              >
                {adding ? 'Adding...' : 'Add Moderator'}
              </Button>
            </div>
          </div>

          {/* Moderators List */}
          <div className="space-y-2">
            <h4 className="font-medium">Current Moderators ({activeModerators.length})</h4>
            {loading ? (
              <p className="text-muted-foreground">Loading moderators...</p>
            ) : activeModerators.length === 0 ? (
              <p className="text-muted-foreground">No moderators added yet</p>
            ) : (
              <div className="space-y-2">
                {activeModerators.map((moderator) => (
                  <div
                    key={moderator.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{moderator.mod_name}</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {moderator.telegram_user_id}
                        </p>
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeModerator(moderator.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">How to get Telegram User ID:</h4>
            <ol className="text-sm text-muted-foreground space-y-1">
              <li>1. Message @userinfobot on Telegram</li>
              <li>2. Send any message to the bot</li>
              <li>3. The bot will reply with your User ID</li>
              <li>4. Copy the ID and paste it above</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};