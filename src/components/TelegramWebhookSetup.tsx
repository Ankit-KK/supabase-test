import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

const TelegramWebhookSetup = () => {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<'unknown' | 'success' | 'error'>('unknown');
  const { toast } = useToast();

  const setupWebhook = async () => {
    setIsSettingUp(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        method: 'GET',
        body: undefined,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        console.error('Error setting up webhook:', error);
        setWebhookStatus('error');
        toast({
          variant: 'destructive',
          title: 'Webhook Setup Failed',
          description: `Failed to setup Telegram webhook: ${error.message}`,
        });
        return;
      }

      setWebhookStatus('success');
      toast({
        title: '✅ Webhook Setup Complete',
        description: 'Telegram webhook has been configured successfully',
      });

    } catch (error) {
      console.error('Error:', error);
      setWebhookStatus('error');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred during webhook setup',
      });
    } finally {
      setIsSettingUp(false);
    }
  };

  const checkBotHealth = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('telegram-bot/health');

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Bot Health Check Failed',
          description: 'Could not reach the Telegram bot service',
        });
        return;
      }

      toast({
        title: '🤖 Bot is Running',
        description: 'Telegram bot service is healthy and responding',
      });

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Health Check Error',
        description: 'Failed to check bot health status',
      });
    }
  };

  return (
    <Card className="bg-black/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-purple-100 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Telegram Webhook Setup
        </CardTitle>
        <CardDescription className="text-purple-300">
          Configure and test the Telegram bot webhook for donation notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-purple-900/20 rounded-lg border border-purple-500/20">
          <div>
            <p className="text-purple-200 font-medium">Webhook Status</p>
            <p className="text-purple-300 text-sm">Current webhook configuration status</p>
          </div>
          <div className="flex items-center space-x-2">
            {webhookStatus === 'success' && (
              <>
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-300">Active</span>
              </>
            )}
            {webhookStatus === 'error' && (
              <>
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-300">Error</span>
              </>
            )}
            {webhookStatus === 'unknown' && (
              <>
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-300">Unknown</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={setupWebhook}
            disabled={isSettingUp}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Settings className="w-4 h-4 mr-2" />
            {isSettingUp ? 'Setting up...' : 'Setup Webhook'}
          </Button>

          <Button
            onClick={checkBotHealth}
            variant="outline"
            className="border-purple-500/50 text-purple-200 hover:bg-purple-500/20"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Check Bot Health
          </Button>
        </div>

        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
          <p className="text-purple-200 text-sm mb-2">
            <strong>Setup Instructions:</strong>
          </p>
          <ol className="text-purple-300 text-sm space-y-1 ml-4 list-decimal">
            <li>Ensure you have configured the TELEGRAM_BOT_TOKEN secret</li>
            <li>Click "Setup Webhook" to configure the bot webhook</li>
            <li>Use "Check Bot Health" to verify the bot is responding</li>
            <li>Test the flow using the testing panel above</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default TelegramWebhookSetup;