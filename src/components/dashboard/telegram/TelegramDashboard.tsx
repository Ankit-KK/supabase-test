import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageCircle, 
  Activity, 
  Smartphone,
  Bot
} from 'lucide-react';

import TelegramBotStatus from './TelegramBotStatus';
import TelegramActivity from './TelegramActivity';

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
  donations,
  tableName,
  onModerationAction,
  streamerId,
  streamerSlug
}) => {
  const [botStatus, setBotStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [streamerTelegramId, setStreamerTelegramId] = useState<string>('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Fetch streamer Telegram ID
  useEffect(() => {
    const fetchStreamerTelegram = async () => {
      try {
        const { data, error } = await supabase
          .from('streamers_moderators')
          .select('telegram_user_id')
          .eq('streamer_id', streamerId)
          .eq('is_active', true)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        if (data) {
          setStreamerTelegramId(data.telegram_user_id);
          setNotificationsEnabled(true);
          setBotStatus('connected');
        } else {
          setBotStatus('disconnected');
        }
      } catch (error) {
        console.error('Error fetching streamer telegram:', error);
        setBotStatus('disconnected');
      }
    };

    fetchStreamerTelegram();
  }, [streamerId]);

  const totalDonationsToday = donations.filter(d => 
    new Date(d.created_at).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="space-y-6">
      {/* Mobile-First Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <MessageCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Telegram Notifications</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Get donation alerts on your phone via Telegram
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Mobile Ready</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{totalDonationsToday}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-blue-500" />
            <div>
              <Badge variant={notificationsEnabled ? 'default' : 'secondary'}>
                {notificationsEnabled ? '🔔 Enabled' : '🔕 Disabled'}
              </Badge>
              <p className="text-xs text-muted-foreground">Notifications</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-purple-500" />
            <div>
              <Badge variant={botStatus === 'connected' ? 'default' : 'secondary'}>
                {botStatus === 'connected' ? '🟢 Online' : '🔴 Offline'}
              </Badge>
              <p className="text-xs text-muted-foreground">Bot Status</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="recent" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recent" className="text-sm">
            Recent Donations
          </TabsTrigger>
          <TabsTrigger value="setup" className="text-sm">
            Telegram Setup
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-sm">
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Donations</CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest donations for reference
              </p>
            </CardHeader>
            <CardContent>
              {donations.slice(0, 10).length > 0 ? (
                <div className="space-y-3">
                  {donations.slice(0, 10).map((donation) => (
                    <div key={donation.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{donation.name}</p>
                        {donation.message && (
                          <p className="text-sm text-muted-foreground">{donation.message}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₹{donation.amount}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(donation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No recent donations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup" className="space-y-4">
          <TelegramBotStatus
            streamerId={streamerId}
            streamerSlug={streamerSlug}
            botStatus={botStatus}
          />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <TelegramActivity streamerId={streamerId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TelegramDashboard;