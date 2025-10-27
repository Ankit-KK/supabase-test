import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Mic, Volume2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StreamerTestCardProps {
  streamerId: string;
  streamerName: string;
  streamerSlug: string;
  brandColor: string;
}

export const StreamerTestCard = ({
  streamerId,
  streamerName,
  streamerSlug,
  brandColor,
}: StreamerTestCardProps) => {
  const [loading, setLoading] = useState<string | null>(null);

  const triggerAlert = async (alertType: 'text' | 'tts' | 'voice' | 'hyperemote') => {
    setLoading(alertType);
    try {
      const { data, error } = await supabase.functions.invoke('admin-trigger-alert', {
        body: {
          streamerId,
          streamerSlug,
          alertType,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success(`${alertType.toUpperCase()} alert triggered for ${streamerName}!`);
    } catch (error: any) {
      console.error('Error triggering alert:', error);
      toast.error(`Failed to trigger alert: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3" style={{ borderTopColor: brandColor, borderTopWidth: '4px' }}>
        <CardTitle className="text-lg" style={{ color: brandColor }}>
          {streamerName}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{streamerSlug}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          onClick={() => triggerAlert('text')}
          disabled={loading !== null}
          className="w-full"
          variant="outline"
          size="sm"
        >
          {loading === 'text' ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <MessageSquare className="h-4 w-4 mr-2" />
          )}
          Test Text (₹50)
        </Button>

        <Button
          onClick={() => triggerAlert('tts')}
          disabled={loading !== null}
          className="w-full"
          variant="outline"
          size="sm"
        >
          {loading === 'tts' ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Volume2 className="h-4 w-4 mr-2" />
          )}
          Test TTS (₹100)
        </Button>

        <Button
          onClick={() => triggerAlert('voice')}
          disabled={loading !== null}
          className="w-full"
          variant="outline"
          size="sm"
        >
          {loading === 'voice' ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Mic className="h-4 w-4 mr-2" />
          )}
          Test Voice (₹200)
        </Button>

        <Button
          onClick={() => triggerAlert('hyperemote')}
          disabled={loading !== null}
          className="w-full"
          variant="outline"
          size="sm"
        >
          {loading === 'hyperemote' ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Test Hyperemote (₹150)
        </Button>
      </CardContent>
    </Card>
  );
};
