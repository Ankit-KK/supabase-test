import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Trash2, UserPlus, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Moderator {
  id: string;
  telegram_user_id: string;
  mod_name: string;
  is_active: boolean;
  created_at: string;
}

interface ModeratorDropdownProps {
  streamerId: string;
}

const ModeratorDropdown: React.FC<ModeratorDropdownProps> = ({ streamerId }) => {
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newModeratorName, setNewModeratorName] = useState('');
  const [newTelegramId, setNewTelegramId] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchModerators();
    }
  }, [streamerId, open]);

  const fetchModerators = async () => {
    try {
      const { data, error } = await supabase
        .from('streamers_moderators')
        .select('*')
        .eq('streamer_id', streamerId)
        .eq('is_active', true)
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

      setModerators(prev => prev.filter(mod => mod.id !== moderatorId));

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          Manage Moderators
          {moderators.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {moderators.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Moderator
            </h4>
            <p className="text-sm text-muted-foreground">
              Moderators can approve donations via Telegram
            </p>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="mod-name">Name</Label>
              <Input
                id="mod-name"
                placeholder="Moderator name"
                value={newModeratorName}
                onChange={(e) => setNewModeratorName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="telegram-id">Telegram User ID</Label>
              <Input
                id="telegram-id"
                placeholder="Get from @userinfobot"
                value={newTelegramId}
                onChange={(e) => setNewTelegramId(e.target.value)}
              />
            </div>
            <Button
              onClick={addModerator}
              disabled={adding || !newModeratorName.trim() || !newTelegramId.trim()}
              className="w-full"
              size="sm"
            >
              {adding ? 'Adding...' : 'Add Moderator'}
            </Button>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">
              Current Moderators ({moderators.length})
            </h4>
            
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : moderators.length === 0 ? (
              <p className="text-sm text-muted-foreground">No moderators added</p>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {moderators.map((moderator) => (
                  <div
                    key={moderator.id}
                    className="flex items-center justify-between p-2 border rounded text-sm"
                  >
                    <div>
                      <p className="font-medium">{moderator.mod_name}</p>
                      <p className="text-xs text-muted-foreground">
                        ID: {moderator.telegram_user_id}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeModerator(moderator.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            <p className="font-medium mb-1">Get Telegram User ID:</p>
            <p>Message @userinfobot on Telegram to get your User ID</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ModeratorDropdown;