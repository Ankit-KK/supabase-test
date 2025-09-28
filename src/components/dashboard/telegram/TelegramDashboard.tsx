import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle, Trash2 } from 'lucide-react';

interface TelegramDashboardProps {
  donations: Array<{
    id: string;
    name: string;
    amount: number;
    message?: string;
    voice_message_url?: string;
    is_hyperemote?: boolean;
    moderation_status: string;
    payment_status: string;
    created_at: string;
    message_visible?: boolean;
  }>;
  tableName: string;
  onModerationAction: () => void;
  streamerId: string;
  streamerSlug: string;
}

const TelegramDashboard: React.FC<TelegramDashboardProps> = ({
  streamerId,
  streamerSlug
}) => {
  const { user } = useAuth();
  const [telegramUserId, setTelegramUserId] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  // Fetch existing Telegram user ID
  useEffect(() => {
    const fetchTelegramUserId = async () => {
      if (!streamerId) {
        console.log('No streamer ID provided');
        setFetchingData(false);
        return;
      }

      console.log('Fetching Telegram user ID for streamer:', streamerId);
      setFetchingData(true);
      
      try {
        const { data, error } = await supabase
          .from('streamers_moderators')
          .select('telegram_user_id, mod_name, is_active')
          .eq('streamer_id', streamerId)
          .eq('is_active', true)
          .maybeSingle();

        console.log('Fetch result:', { data, error });

        if (error) {
          console.error('Database error:', error);
          throw error;
        }
        
        if (data && data.telegram_user_id) {
          console.log('Found existing Telegram user ID:', data.telegram_user_id);
          setTelegramUserId(data.telegram_user_id);
        } else {
          console.log('No Telegram user ID found for this streamer');
          setTelegramUserId('');
        }
      } catch (error) {
        console.error('Error fetching telegram user ID:', error);
        toast({
          title: "Error",
          description: "Failed to load Telegram settings",
          variant: "destructive",
        });
      } finally {
        setFetchingData(false);
      }
    };

    fetchTelegramUserId();
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
      console.log('User ID:', user.id);
      console.log('Streamer ID:', streamerId);
      
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

      setTelegramUserId(inputValue.trim());
      setInputValue('');
      toast({
        title: "Success",
        description: "Telegram user ID added successfully",
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

  const handleRemoveTelegramUser = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to remove Telegram notifications",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
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

      setTelegramUserId('');
      toast({
        title: "Success",
        description: "Telegram user ID removed successfully",
      });
    } catch (error) {
      console.error('Error removing telegram user:', error);
      toast({
        title: "Error",
        description: "Failed to remove Telegram user ID",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
              Add your Telegram User ID to receive donation alerts
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {fetchingData ? (
          <div className="flex items-center justify-center py-4">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        ) : telegramUserId ? (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Telegram notifications enabled
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                User ID: {telegramUserId}
              </p>
            </div>
            <Button 
              onClick={handleRemoveTelegramUser}
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Telegram User
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="telegram-user-id">Telegram User ID</Label>
              <Input
                id="telegram-user-id"
                placeholder="Enter your Telegram User ID"
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
              Add Telegram User
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TelegramDashboard;