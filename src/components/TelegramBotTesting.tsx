import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TestTube, Send, Trash2, AlertTriangle } from 'lucide-react';
import { logSecurityEvent } from '@/utils/rateLimiting';

interface TestDonation {
  name: string;
  amount: number;
  message: string;
  gif_url?: string;
  voice_url?: string;
  custom_sound_name?: string;
  include_sound: boolean;
  hyperemotes_enabled: boolean;
}

const TelegramBotTesting = () => {
  const [testDonation, setTestDonation] = useState<TestDonation>({
    name: 'Test User',
    amount: 100,
    message: 'This is a test donation for Telegram bot testing',
    include_sound: false,
    hyperemotes_enabled: false,
  });
  
  const [isCreating, setIsCreating] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const { toast } = useToast();

  const createTestDonation = async () => {
    setIsCreating(true);
    try {
      logSecurityEvent('TEST_DONATION_CREATE', 'Creating test donation for Telegram bot testing');
      
      const orderId = `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { data, error } = await supabase
        .from('chiaa_gaming_donations')
        .insert({
          ...testDonation,
          order_id: orderId,
          payment_status: 'success', // Set as success so it appears in the main list
          review_status: 'pending', // Start as pending for moderation
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating test donation:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to create test donation',
        });
        return;
      }

      setLastCreatedId(data.id);
      toast({
        title: '✅ Test Donation Created',
        description: `Test donation created with ID: ${data.id.slice(0, 8)}...`,
      });

    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const sendManualNotification = async (donationId?: string) => {
    if (!donationId && !lastCreatedId) {
      toast({
        variant: 'destructive',
        title: 'No Donation Selected',
        description: 'Create a test donation first or provide a donation ID',
      });
      return;
    }

    setIsSendingNotification(true);
    const targetId = donationId || lastCreatedId;

    try {
      logSecurityEvent('MANUAL_TELEGRAM_NOTIFICATION', `Sending manual notification for donation: ${targetId}`);

      // First, get the donation data
      const { data: donation, error: fetchError } = await supabase
        .from('chiaa_gaming_donations')
        .select('*')
        .eq('id', targetId)
        .single();

      if (fetchError || !donation) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Donation not found',
        });
        return;
      }

      // Call the donation-notification edge function directly
      const { data, error } = await supabase.functions.invoke('donation-notification', {
        body: {
          type: 'INSERT',
          table: 'chiaa_gaming_donations',
          record: donation
        }
      });

      if (error) {
        console.error('Error sending notification:', error);
        toast({
          variant: 'destructive',
          title: 'Notification Failed',
          description: `Failed to send Telegram notification: ${error.message}`,
        });
        return;
      }

      toast({
        title: '📱 Notification Sent',
        description: 'Telegram notification sent to moderators successfully',
      });

    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsSendingNotification(false);
    }
  };

  const cleanupTestDonations = async () => {
    try {
      logSecurityEvent('TEST_DONATIONS_CLEANUP', 'Cleaning up test donations');

      // Delete donations with order_id starting with "TEST_"
      const { error } = await supabase
        .from('chiaa_gaming_donations')
        .delete()
        .like('order_id', 'TEST_%');

      if (error) {
        console.error('Error cleaning up test donations:', error);
        toast({
          variant: 'destructive',
          title: 'Cleanup Failed',
          description: 'Failed to clean up test donations',
        });
        return;
      }

      setLastCreatedId(null);
      toast({
        title: '🧹 Cleanup Complete',
        description: 'All test donations have been removed',
      });

    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred during cleanup',
      });
    }
  };

  const presetScenarios = [
    {
      name: 'Simple Donation',
      data: { name: 'TestUser1', amount: 50, message: 'Simple test donation', include_sound: false, hyperemotes_enabled: false }
    },
    {
      name: 'Large Donation with Sound',
      data: { name: 'BigDonor', amount: 1000, message: 'Big donation with custom sound effect!', include_sound: true, custom_sound_name: 'epic-sound', hyperemotes_enabled: false }
    },
    {
      name: 'Donation with HyperEmotes',
      data: { name: 'EmoteUser', amount: 250, message: 'Test donation with hyperemotes enabled', include_sound: false, hyperemotes_enabled: true }
    },
    {
      name: 'Full Feature Donation',
      data: { name: 'PowerUser', amount: 500, message: 'Testing all features together!', include_sound: true, custom_sound_name: 'celebration', hyperemotes_enabled: true, gif_url: 'https://example.com/test.gif' }
    }
  ];

  return (
    <Card className="bg-black/50 border-blue-500/30">
      <CardHeader>
        <CardTitle className="text-blue-100 flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Telegram Bot Testing
        </CardTitle>
        <CardDescription className="text-blue-300">
          Create test donations and manually trigger Telegram notifications for testing the moderation workflow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Warning */}
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-200 text-sm">
              Test donations will appear in your main dashboard. Use cleanup function to remove them.
            </span>
          </div>
        </div>

        {/* Preset Scenarios */}
        <div>
          <Label className="text-blue-200 text-sm font-medium">Quick Test Scenarios</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {presetScenarios.map((scenario, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setTestDonation({ ...testDonation, ...scenario.data })}
                className="border-blue-500/30 text-blue-200 hover:bg-blue-500/20"
              >
                {scenario.name}
              </Button>
            ))}
          </div>
        </div>

        <Separator className="bg-blue-500/20" />

        {/* Test Donation Form */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name" className="text-blue-200">Donor Name</Label>
            <Input
              id="name"
              value={testDonation.name}
              onChange={(e) => setTestDonation({ ...testDonation, name: e.target.value })}
              className="bg-blue-900/20 border-blue-500/30 text-blue-100"
            />
          </div>
          <div>
            <Label htmlFor="amount" className="text-blue-200">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              value={testDonation.amount}
              onChange={(e) => setTestDonation({ ...testDonation, amount: Number(e.target.value) })}
              className="bg-blue-900/20 border-blue-500/30 text-blue-100"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="message" className="text-blue-200">Message</Label>
          <Textarea
            id="message"
            value={testDonation.message}
            onChange={(e) => setTestDonation({ ...testDonation, message: e.target.value })}
            className="bg-blue-900/20 border-blue-500/30 text-blue-100"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="custom_sound" className="text-blue-200">Custom Sound Name</Label>
            <Input
              id="custom_sound"
              value={testDonation.custom_sound_name || ''}
              onChange={(e) => setTestDonation({ ...testDonation, custom_sound_name: e.target.value })}
              placeholder="epic-sound"
              className="bg-blue-900/20 border-blue-500/30 text-blue-100"
            />
          </div>
          <div>
            <Label htmlFor="gif_url" className="text-blue-200">GIF URL (Optional)</Label>
            <Input
              id="gif_url"
              value={testDonation.gif_url || ''}
              onChange={(e) => setTestDonation({ ...testDonation, gif_url: e.target.value })}
              placeholder="https://example.com/test.gif"
              className="bg-blue-900/20 border-blue-500/30 text-blue-100"
            />
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="include_sound"
              checked={testDonation.include_sound}
              onCheckedChange={(checked) => setTestDonation({ ...testDonation, include_sound: checked })}
            />
            <Label htmlFor="include_sound" className="text-blue-200">Include Sound</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="hyperemotes"
              checked={testDonation.hyperemotes_enabled}
              onCheckedChange={(checked) => setTestDonation({ ...testDonation, hyperemotes_enabled: checked })}
            />
            <Label htmlFor="hyperemotes" className="text-blue-200">HyperEmotes</Label>
          </div>
        </div>

        <Separator className="bg-blue-500/20" />

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={createTestDonation}
            disabled={isCreating}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <TestTube className="w-4 h-4 mr-2" />
            {isCreating ? 'Creating...' : 'Create Test Donation'}
          </Button>

          <Button
            onClick={() => sendManualNotification()}
            disabled={isSendingNotification || !lastCreatedId}
            variant="outline"
            className="border-green-500/50 text-green-200 hover:bg-green-500/20"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSendingNotification ? 'Sending...' : 'Send to Telegram'}
          </Button>

          <Button
            onClick={cleanupTestDonations}
            variant="outline"
            className="border-red-500/50 text-red-200 hover:bg-red-500/20"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Cleanup Test Data
          </Button>
        </div>

        {lastCreatedId && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
            <p className="text-green-200 text-sm">
              Last created test donation ID: <code className="bg-green-800/30 px-2 py-1 rounded">{lastCreatedId.slice(0, 8)}...</code>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TelegramBotTesting;