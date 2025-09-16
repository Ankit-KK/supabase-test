import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Activity, Zap, Database, Eye, EyeOff } from 'lucide-react';

interface RealtimeDebugPanelProps {
  streamerId?: string;
  connectionStatus?: 'connecting' | 'connected' | 'disconnected';
}

export const RealtimeDebugPanel: React.FC<RealtimeDebugPanelProps> = ({ 
  streamerId, 
  connectionStatus = 'disconnected' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [recentDonations, setRecentDonations] = useState<any[]>([]);
  const [testMode, setTestMode] = useState(false);
  const { toast } = useToast();

  // Fetch recent donations for debugging
  const fetchRecentDonations = async () => {
    if (!streamerId) return;

    try {
      const { data, error } = await supabase
        .from('ankit_donations')
        .select('id, name, amount, payment_status, moderation_status, created_at, is_hyperemote')
        .eq('streamer_id', streamerId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error) {
        setRecentDonations(data || []);
      }
    } catch (error) {
      console.error('Error fetching recent donations:', error);
    }
  };

  // Test alert trigger
  const triggerTestAlert = async () => {
    if (!streamerId) return;

    const testDonation = {
      id: `test-${Date.now()}`,
      streamer_id: streamerId,
      name: 'Test Donor',
      amount: 100,
      message: 'This is a test alert message!',
      payment_status: 'success',
      moderation_status: 'approved',
      is_hyperemote: false,
      message_visible: true,
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase
        .from('ankit_donations')
        .insert(testDonation);

      if (!error) {
        toast({
          title: "🧪 Test Alert Triggered",
          description: "Check if the alert appears in OBS",
          duration: 3000,
        });
      } else {
        console.error('Error creating test donation:', error);
      }
    } catch (error) {
      console.error('Error triggering test alert:', error);
    }
  };

  // Test hyperemote alert
  const triggerHyperemoteTest = async () => {
    if (!streamerId) return;

    const testHyperemote = {
      id: `hyperemote-test-${Date.now()}`,
      streamer_id: streamerId,
      name: 'Hyperemote Tester',
      amount: 200,
      message: 'Test hyperemote animation!',
      payment_status: 'success',
      moderation_status: 'auto_approved',
      is_hyperemote: true,
      message_visible: true,
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase
        .from('ankit_donations')
        .insert(testHyperemote);

      if (!error) {
        toast({
          title: "🎉 Hyperemote Test Triggered",
          description: "Check if the hyperemote animation appears",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error triggering hyperemote test:', error);
    }
  };

  useEffect(() => {
    if (streamerId) {
      fetchRecentDonations();
    }
  }, [streamerId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'disconnected': return '🔴';
      default: return '⚫';
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-background/80 backdrop-blur-sm"
        >
          <Activity className="w-4 h-4 mr-2" />
          Debug Panel
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="bg-background/90 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Real-time Debug
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription className="text-xs">
            Monitor real-time connections and test alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Connection</span>
            <Badge variant="outline" className="text-xs">
              {getStatusIcon(connectionStatus)} {connectionStatus}
            </Badge>
          </div>

          {/* Streamer ID */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Streamer ID</span>
            <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
              {streamerId?.slice(0, 8)}...
            </span>
          </div>

          {/* Test Buttons */}
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={triggerTestAlert}
              className="w-full text-xs"
              disabled={!streamerId || connectionStatus !== 'connected'}
            >
              <Zap className="w-3 h-3 mr-2" />
              Test Regular Alert
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={triggerHyperemoteTest}
              className="w-full text-xs"
              disabled={!streamerId || connectionStatus !== 'connected'}
            >
              <Zap className="w-3 h-3 mr-2" />
              Test Hyperemote
            </Button>
          </div>

          {/* Recent Donations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Recent Donations</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchRecentDonations}
                className="text-xs"
              >
                <Database className="w-3 h-3" />
              </Button>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {recentDonations.map((donation) => (
                <div
                  key={donation.id}
                  className="text-xs p-2 bg-muted/50 rounded flex justify-between"
                >
                  <div>
                    <div className="font-medium">{donation.name}</div>
                    <div className="text-muted-foreground">₹{donation.amount}</div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-block w-2 h-2 rounded-full ${
                      donation.payment_status === 'success' ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    <div className="text-muted-foreground">
                      {donation.moderation_status}
                    </div>
                  </div>
                </div>
              ))}
              {recentDonations.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-2">
                  No recent donations
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};