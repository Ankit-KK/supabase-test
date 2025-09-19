import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bot, 
  CheckCircle, 
  AlertCircle, 
  Wifi, 
  WifiOff, 
  Settings, 
  ExternalLink,
  Copy,
  RefreshCw
} from 'lucide-react';

interface TelegramBotStatusProps {
  streamerId: string;
  streamerSlug: string;
  botStatus: 'connected' | 'disconnected' | 'checking';
}

const TelegramBotStatus: React.FC<TelegramBotStatusProps> = ({
  streamerId,
  streamerSlug,
  botStatus
}) => {
  const [settingUpWebhook, setSettingUpWebhook] = useState(false);

  const setupWebhook = async () => {
    setSettingUpWebhook(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-telegram-webhook', {
        body: { streamerId }
      });

      if (error) throw error;

      toast({
        title: "Webhook Setup Complete",
        description: "Your Telegram bot is now ready to receive donation notifications!",
      });
    } catch (error) {
      console.error('Error setting up webhook:', error);
      toast({
        title: "Setup Failed",
        description: "Failed to setup Telegram webhook. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSettingUpWebhook(false);
    }
  };

  const copyBotUsername = () => {
    navigator.clipboard.writeText('@YourBotUsername'); // Replace with actual bot username
    toast({
      title: "Copied!",
      description: "Bot username copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      {/* Bot Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span>Telegram Bot Status</span>
            <Badge variant={botStatus === 'connected' ? 'default' : 'secondary'}>
              {botStatus === 'checking' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
              {botStatus === 'connected' && <CheckCircle className="h-3 w-3 mr-1" />}
              {botStatus === 'disconnected' && <AlertCircle className="h-3 w-3 mr-1" />}
              {botStatus === 'checking' ? 'Checking...' : 
               botStatus === 'connected' ? 'Connected' : 'Not Connected'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              {botStatus === 'connected' ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className="font-medium">Webhook Status</p>
                <p className="text-sm text-muted-foreground">
                  {botStatus === 'connected' ? 'Active & Receiving' : 'Not Configured'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <Settings className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">Bot Configuration</p>
                <p className="text-sm text-muted-foreground">
                  {botStatus === 'connected' ? 'Properly Configured' : 'Setup Required'}
                </p>
              </div>
            </div>
          </div>

          {botStatus === 'disconnected' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your Telegram bot is not connected. Set up the webhook to start receiving 
                donation notifications on Telegram.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={setupWebhook}
              disabled={settingUpWebhook}
              className="flex items-center space-x-2"
            >
              {settingUpWebhook ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Setting up...</span>
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4" />
                  <span>{botStatus === 'connected' ? 'Reconfigure' : 'Setup'} Webhook</span>
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={copyBotUsername} className="flex items-center space-x-2">
              <Copy className="h-4 w-4" />
              <span>Copy Bot Username</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use Telegram Moderation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Add Moderators</p>
                <p className="text-sm text-muted-foreground">
                  Go to the Moderators tab and add Telegram user IDs of people who can approve donations.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Setup Bot Webhook</p>
                <p className="text-sm text-muted-foreground">
                  Click the setup button above to configure the Telegram webhook for your stream.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Get Notifications on Mobile</p>
                <p className="text-sm text-muted-foreground">
                  Moderators will receive real-time donation notifications and can access the dashboard from Telegram.
                </p>
              </div>
            </div>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Pro Tip:</strong> Add multiple moderators to get comprehensive donation notifications 
              and analytics across your team!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Telegram Commands */}
      <Card>
        <CardHeader>
          <CardTitle>Available Telegram Commands</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="bg-muted/50 p-3 rounded-lg">
                <code className="text-sm font-mono">/start</code>
                <p className="text-xs text-muted-foreground mt-1">Initialize bot and check status</p>
              </div>
              
              <div className="bg-muted/50 p-3 rounded-lg">
                <code className="text-sm font-mono">/recent</code>
                <p className="text-xs text-muted-foreground mt-1">View recent donations</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="bg-muted/50 p-3 rounded-lg">
                <code className="text-sm font-mono">/status</code>
                <p className="text-xs text-muted-foreground mt-1">Check moderator status</p>
              </div>
              
              <div className="bg-muted/50 p-3 rounded-lg">
                <code className="text-sm font-mono">/stats</code>
                <p className="text-xs text-muted-foreground mt-1">View donation statistics</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TelegramBotStatus;