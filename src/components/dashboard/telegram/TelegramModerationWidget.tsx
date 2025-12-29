import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Shield, Users, MessageSquare, CheckCircle, XCircle } from 'lucide-react';

interface TelegramModerationWidgetProps {
  streamerId: string;
  streamerSlug: string;
  tableName: string;
  onModerationAction?: () => void;
  showPendingCount?: boolean;
  compact?: boolean;
}

const TelegramModerationWidget: React.FC<TelegramModerationWidgetProps> = ({
  streamerId,
  streamerSlug,
  tableName,
  onModerationAction,
  showPendingCount = true,
  compact = false
}) => {
  const [moderationEnabled, setModerationEnabled] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [moderatorCount, setModeratorCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetchData();
  }, [streamerId, tableName]);

  const fetchData = async () => {
    if (!streamerId) return;
    
    setLoading(true);
    try {
      // Fetch streamer settings
      const { data: streamerData, error: streamerError } = await supabase
        .from('streamers')
        .select('telegram_moderation_enabled')
        .eq('id', streamerId)
        .single();

      if (streamerError) throw streamerError;
      setModerationEnabled(streamerData?.telegram_moderation_enabled ?? true);

      // Fetch moderator count via edge function (bypasses RLS)
      const { data: telegramSettings, error: telegramError } = await supabase.functions.invoke('get-telegram-settings', {
        body: { streamerId }
      });

      if (!telegramError && telegramSettings) {
        setModeratorCount(telegramSettings.moderatorCount || 0);
      }

      // Fetch pending donations count if needed
      if (showPendingCount) {
        const { count: pendingDonations, error: pendingError } = await supabase
          .from(tableName as any)
          .select('*', { count: 'exact', head: true })
          .eq('streamer_id', streamerId)
          .eq('payment_status', 'success')
          .eq('moderation_status', 'pending');

        if (!pendingError) setPendingCount(pendingDonations || 0);
      }
    } catch (error) {
      console.error('Error fetching telegram moderation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleModeration = async (enabled: boolean) => {
    setToggling(true);
    try {
      const { error } = await supabase
        .from('streamers')
        .update({ telegram_moderation_enabled: enabled })
        .eq('id', streamerId);

      if (error) throw error;

      setModerationEnabled(enabled);
      toast({
        title: enabled ? "Moderation Enabled" : "Moderation Disabled",
        description: enabled 
          ? "Moderators will receive Approve/Reject buttons on Telegram" 
          : "Donations will be auto-approved without Telegram moderation",
      });
      
      if (onModerationAction) onModerationAction();
    } catch (error) {
      console.error('Error toggling moderation:', error);
      toast({
        title: "Error",
        description: "Failed to update moderation settings",
        variant: "destructive",
      });
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <Card className={compact ? "p-4" : ""}>
        <CardContent className="flex items-center justify-center py-6">
          <div className="text-sm text-muted-foreground">Loading moderation settings...</div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">Telegram Moderation</h4>
              <p className="text-xs text-muted-foreground">
                {moderationEnabled ? 'Active' : 'Disabled'} • {moderatorCount} moderator{moderatorCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {showPendingCount && pendingCount > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                {pendingCount} pending
              </Badge>
            )}
            <Switch
              checked={moderationEnabled}
              onCheckedChange={handleToggleModeration}
              disabled={toggling}
            />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Telegram Moderation</CardTitle>
              <p className="text-sm text-muted-foreground">
                Approve/Reject donations directly from Telegram
              </p>
            </div>
          </div>
          <Badge 
            variant={moderationEnabled ? "default" : "secondary"}
            className={moderationEnabled ? "bg-green-500" : ""}
          >
            {moderationEnabled ? 'Active' : 'Disabled'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bot Info */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full">
              <Bot className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                HyperChat Moderation Bot
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
            Moderators will receive donation alerts with Approve/Reject buttons
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs">Active Moderators</span>
            </div>
            <p className="text-2xl font-bold">{moderatorCount}</p>
          </div>
          {showPendingCount && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">Pending Approval</span>
              </div>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
          )}
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="moderation-toggle" className="text-sm font-medium">
              Enable Telegram Moderation
            </Label>
            <p className="text-xs text-muted-foreground">
              When disabled, donations are auto-approved
            </p>
          </div>
          <Switch
            id="moderation-toggle"
            checked={moderationEnabled}
            onCheckedChange={handleToggleModeration}
            disabled={toggling}
          />
        </div>

        {/* How it works */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">How it works:</h4>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                New donations are sent to Telegram with <strong>Approve ✅</strong> and <strong>Reject ❌</strong> buttons
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Moderators tap buttons to approve/reject directly from Telegram
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Approved donations appear on stream in real-time
              </p>
            </div>
          </div>
        </div>

        {moderatorCount === 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-amber-600" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                No moderators configured. Add moderators to receive Telegram notifications.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TelegramModerationWidget;
