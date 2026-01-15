import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle, Trash2, Bot, UserPlus, Users } from 'lucide-react';

interface Moderator {
  id: string;
  telegram_user_id: string;
  mod_name: string;
  is_active: boolean;
  role?: string;
}

interface TelegramDashboardProps {
  streamerId: string;
  streamerSlug: string;
}

const TelegramDashboard: React.FC<TelegramDashboardProps> = ({
  streamerId,
  streamerSlug
}) => {
  const { user } = useAuth();
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [fetchingData, setFetchingData] = useState(true);

  // Fetch existing Telegram moderators via edge function
  useEffect(() => {
    const fetchTelegramModerators = async () => {
      if (!streamerId) {
        console.log('No streamer ID provided');
        setFetchingData(false);
        return;
      }

      console.log('Fetching Telegram moderators for streamer:', streamerId);
      setFetchingData(true);
      
      try {
        const { data, error } = await supabase.functions.invoke('get-telegram-settings', {
          body: { streamerId }
        });

        console.log('Edge function result:', { data, error });

        if (error) {
          console.error('Edge function error:', error);
          throw error;
        }
        
        if (data && data.moderators) {
          console.log('Found moderators:', data.moderators);
          setModerators(data.moderators);
        } else {
          console.log('No moderators found for this streamer');
          setModerators([]);
        }
      } catch (error) {
        console.error('Error fetching telegram moderators:', error);
        toast({
          title: "Error",
          description: "Failed to load Telegram settings",
          variant: "destructive",
        });
      } finally {
        setFetchingData(false);
      }
    };

    fetchTelegramModerators();
  }, [streamerId]);

  const handleAddTelegramUser = async () => {
    if (!inputValue.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Telegram User ID",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to add Telegram notifications",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const authToken = localStorage.getItem('auth_token');
      console.log('Auth token exists:', !!authToken);
      
      if (!authToken) {
        toast({
          title: "Error",
          description: "Authentication required. Please log in again.",
          variant: "destructive",
        });
        return;
      }

      console.log('Invoking manage-telegram-user with action: add');
      const { data, error } = await supabase.functions.invoke('manage-telegram-user', {
        body: {
          action: 'add',
          streamerId,
          telegramUserId: inputValue.trim(),
          authToken
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        toast({
          title: "Error",
          description: "Network error occurred",
          variant: "destructive",
        });
        return;
      }

      if (!data || !data.success) {
        console.error('Operation failed:', data?.error);
        toast({
          title: "Error",
          description: data?.error || "Failed to add Telegram user ID",
          variant: "destructive",
        });
        return;
      }

      // Add to local state
      const newModerator: Moderator = {
        id: Date.now().toString(), // Temporary ID until refresh
        telegram_user_id: inputValue.trim(),
        mod_name: 'Telegram User',
        is_active: true
      };
      setModerators(prev => [...prev, newModerator]);
      setInputValue('');
      toast({
        title: "Success",
        description: "Telegram user added successfully",
      });
    } catch (error) {
      console.error('Error adding telegram user:', error);
      toast({
        title: "Error",
        description: "Failed to add Telegram user ID",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTelegramUser = async (telegramUserId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to remove Telegram notifications",
        variant: "destructive",
      });
      return;
    }

    setRemovingId(telegramUserId);
    try {
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        toast({
          title: "Error",
          description: "Authentication required. Please log in again.",
          variant: "destructive",
        });
        return;
      }

      console.log('Invoking manage-telegram-user with action: remove');
      const { data, error } = await supabase.functions.invoke('manage-telegram-user', {
        body: {
          action: 'remove',
          streamerId,
          telegramUserId,
          authToken
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        toast({
          title: "Error",
          description: "Network error occurred",
          variant: "destructive",
        });
        return;
      }

      if (!data || !data.success) {
        console.error('Operation failed:', data?.error);
        toast({
          title: "Error",
          description: data?.error || "Failed to remove Telegram user ID",
          variant: "destructive",
        });
        return;
      }

      // Remove from local state
      setModerators(prev => prev.filter(m => m.telegram_user_id !== telegramUserId));
      toast({
        title: "Success",
        description: "Telegram user removed successfully",
      });
    } catch (error) {
      console.error('Error removing telegram user:', error);
      toast({
        title: "Error",
        description: "Failed to remove Telegram user ID",
        variant: "destructive",
      });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <MessageCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle>Telegram Notifications</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add Telegram User IDs to receive donation alerts
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bot Info Box */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full">
              <Bot className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                HyperChat Notification Bot
              </p>
              <a 
                href="https://t.me/hyperChat_modbot" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-base font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                @hyperChat_modbot
              </a>
            </div>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            Start a chat with this bot on Telegram to receive donation notifications
          </p>
        </div>

        {fetchingData ? (
          <div className="flex items-center justify-center py-4">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <>
            {/* Active Moderators List */}
            {moderators.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Active Telegram Users ({moderators.length})</span>
                </div>
                <div className="space-y-2">
                  {moderators.map((mod) => (
                    <div 
                      key={mod.telegram_user_id}
                      className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                    >
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          {mod.mod_name || 'Telegram User'}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          ID: {mod.telegram_user_id}
                        </p>
                      </div>
                      <Button 
                        onClick={() => handleRemoveTelegramUser(mod.telegram_user_id)}
                        disabled={removingId === mod.telegram_user_id}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Telegram User */}
            <div className="space-y-4 pt-2">
              <div>
                <Label htmlFor="telegram-user-id" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add Telegram User ID
                </Label>
                <Input
                  id="telegram-user-id"
                  placeholder="Enter Telegram User ID"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Get your User ID by messaging @userinfobot on Telegram
                </p>
              </div>
              <Button 
                onClick={handleAddTelegramUser}
                disabled={loading || !inputValue.trim()}
                className="w-full"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Telegram User
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TelegramDashboard;
