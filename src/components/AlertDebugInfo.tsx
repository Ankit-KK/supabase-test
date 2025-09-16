import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Bug, RefreshCw, Zap } from 'lucide-react';

interface AlertDebugInfoProps {
  streamerId?: string;
  streamerSlug?: string;
  connectionState?: any;
  className?: string;
}

export const AlertDebugInfo: React.FC<AlertDebugInfoProps> = ({
  streamerId,
  streamerSlug,
  connectionState,
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [testResult, setTestResult] = useState<string>('');

  const runConnectionTest = async () => {
    if (!streamerId || !streamerSlug) {
      setTestResult('❌ No streamer ID or slug available');
      return;
    }

    try {
      setTestResult('🔄 Testing connection...');

      // Map streamer slug to actual table name
      const tableMap: Record<string, 'ankit_donations' | 'demostreamer_donations' | 'chia_gaming_donations'> = {
        'ankit': 'ankit_donations',
        'demostreamer': 'demostreamer_donations',
        'chia_gaming': 'chia_gaming_donations'
      };

      const tableName = tableMap[streamerSlug];
      if (!tableName) {
        setTestResult('❌ Unknown streamer slug');
        return;
      }

      // Test database connection
      const { data: donations, error } = await supabase
        .from(tableName)
        .select('id, name, amount, moderation_status, payment_status')
        .eq('streamer_id', streamerId)
        .limit(1);

      if (error) {
        setTestResult(`❌ Database test failed: ${error.message}`);
        return;
      }

      // Test real-time subscription
      const testChannel = supabase
        .channel('debug-test')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: tableName,
            filter: `streamer_id=eq.${streamerId}`
          },
          (payload) => {
            console.log('🧪 Test subscription received:', payload);
          }
        )
        .subscribe((status) => {
          console.log('🧪 Test subscription status:', status);
          setTimeout(() => {
            supabase.removeChannel(testChannel);
          }, 2000);
        });

      setTestResult(`✅ Tests completed. Found ${donations.length} donations. Check console for subscription test.`);
    } catch (error) {
      setTestResult(`❌ Test failed: ${error}`);
    }
  };

  const simulateTestAlert = () => {
    console.log('🎬 Simulating test alert...');
    window.dispatchEvent(new CustomEvent('donation-update', {
      detail: {
        payload: {
          eventType: 'UPDATE',
          new: {
            id: 'test-' + Date.now(),
            name: 'Test Donor',
            amount: 100,
            message: 'This is a test alert!',
            moderation_status: 'approved',
            payment_status: 'success',
            is_hyperemote: false,
            created_at: new Date().toISOString()
          }
        },
        streamerId,
        streamerSlug
      }
    }));
    setTestResult('🎬 Test alert dispatched! Check OBS for alert display.');
  };

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className={`fixed bottom-4 right-4 ${className}`}
      >
        <Bug className="w-4 h-4 mr-1" />
        Debug
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-4 right-4 w-96 max-h-80 overflow-y-auto ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Bug className="w-4 h-4" />
            Alert Debug Info
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div>
          <strong>Streamer ID:</strong> {streamerId || 'Not set'}
        </div>
        <div>
          <strong>Streamer Slug:</strong> {streamerSlug || 'Not set'}
        </div>
        <div>
          <strong>Connection Status:</strong>{' '}
          <Badge variant={connectionState?.status === 'connected' ? 'default' : 'destructive'}>
            {connectionState?.status || 'Unknown'}
          </Badge>
        </div>
        {connectionState?.error && (
          <div className="text-red-600">
            <strong>Error:</strong> {connectionState.error}
          </div>
        )}
        
        <div className="flex gap-1 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={runConnectionTest}
            className="text-xs px-2 py-1 h-auto"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Test
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={simulateTestAlert}
            className="text-xs px-2 py-1 h-auto"
          >
            <Zap className="w-3 h-3 mr-1" />
            Alert
          </Button>
        </div>
        
        {testResult && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
            {testResult}
          </div>
        )}
      </CardContent>
    </Card>
  );
};