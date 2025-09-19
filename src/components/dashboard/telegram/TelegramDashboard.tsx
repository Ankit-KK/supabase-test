import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageCircle, 
  Users, 
  Activity, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  Smartphone,
  Bot
} from 'lucide-react';

import TelegramBotStatus from './TelegramBotStatus';
import PendingDonations from './PendingDonations';
import TelegramActivity from './TelegramActivity';
import QuickActions from './QuickActions';
import { ModeratorManager } from '../ModeratorManager';

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
  const [moderatorCount, setModeratorCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Fetch moderator count
  useEffect(() => {
    const fetchModeratorCount = async () => {
      try {
        const { data, error } = await supabase
          .from('streamers_moderators')
          .select('id')
          .eq('streamer_id', streamerId)
          .eq('is_active', true);

        if (error) throw error;
        setModeratorCount(data?.length || 0);
      } catch (error) {
        console.error('Error fetching moderator count:', error);
      }
    };

    fetchModeratorCount();
  }, [streamerId]);

  // Mock bot status check (you can enhance this with actual webhook status checking)
  useEffect(() => {
    const checkBotStatus = async () => {
      // Simulate checking bot status
      setTimeout(() => {
        setBotStatus(moderatorCount > 0 ? 'connected' : 'disconnected');
      }, 1000);
    };

    checkBotStatus();
  }, [moderatorCount]);

  const pendingCount = donations.length;
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
                <CardTitle className="text-xl">Telegram Dashboard</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage donations on mobile via Telegram
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{moderatorCount}</p>
              <p className="text-xs text-muted-foreground">Moderators</p>
            </div>
          </div>
        </Card>

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
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="text-sm">
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="moderators" className="text-sm">
            Moderators
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-sm">
            Activity
          </TabsTrigger>
          <TabsTrigger value="setup" className="text-sm">
            Bot Setup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <PendingDonations
                donations={donations}
                tableName={tableName}
                onModerationAction={onModerationAction}
              />
            </div>
            {pendingCount > 0 && (
              <div className="sm:w-80">
                <QuickActions
                  donations={donations}
                  tableName={tableName}
                  onModerationAction={onModerationAction}
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="moderators" className="space-y-4">
          <ModeratorManager streamerId={streamerId} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <TelegramActivity streamerId={streamerId} />
        </TabsContent>

        <TabsContent value="setup" className="space-y-4">
          <TelegramBotStatus
            streamerId={streamerId}
            streamerSlug={streamerSlug}
            botStatus={botStatus}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TelegramDashboard;