import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const TestAlerts = () => {
  const [loading, setLoading] = useState(false);
  const [streamerSlug, setStreamerSlug] = useState('ankit');

  const triggerTestAlert = async () => {
    setLoading(true);
    try {
      console.log('🧪 Triggering test alert for:', streamerSlug);
      
      const { data, error } = await supabase.functions.invoke('obs-alerts-ws', {
        body: { 
          streamer_slug: streamerSlug,
          test: true
        }
      });

      if (error) {
        throw error;
      }

      console.log('📤 Test alert response:', data);
      toast.success(`Test alert sent! Active connections: ${data.activeConnections || 0}`);
      
    } catch (error) {
      console.error('❌ Error sending test alert:', error);
      toast.error(`Failed to send test alert: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Test Alert System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Streamer Slug
              </label>
              <Input 
                value={streamerSlug}
                onChange={(e) => setStreamerSlug(e.target.value)}
                placeholder="Enter streamer slug (e.g., ankit)"
              />
            </div>
            
            <Button 
              onClick={triggerTestAlert}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Sending Test Alert...' : 'Send Test Alert'}
            </Button>

            <div className="text-sm text-muted-foreground">
              <p>This will send a test alert to any connected OBS WebSocket connections.</p>
              <p className="mt-2 font-semibold">⚠️ To see alerts, you need to open the alerts page first:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Go to your Ankit Dashboard</li>
                <li>Copy the OBS Alerts URL from the OBS Settings tab</li>
                <li>Open that URL in a new tab (or add it as OBS Browser Source)</li>
                <li>Then come back here and click "Send Test Alert"</li>
              </ol>
              <p className="mt-2 text-xs text-amber-600">💡 The alert will only show on the alerts page, not here!</p>
              
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">Quick Access:</p>
                <Button 
                  onClick={() => window.open('/ankit/dashboard', '_blank')}
                  variant="outline"
                  size="sm"
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  Open Ankit Dashboard →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestAlerts;