import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, RefreshCw, AlertCircle, Info, LucideIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePusherAudioQueue } from '@/hooks/usePusherAudioQueue';
import { usePusherConfig } from '@/hooks/usePusherConfig';

const SUPABASE_PROJECT_URL = 'https://vsevsjvtrshgeiudrnth.supabase.co';

interface MediaSourcePlayerProps {
  streamerSlug: string;
  streamerName: string;
  tableName: string;
  browserSourcePath: string;
  brandColor?: string;
  Icon?: LucideIcon;
}

const MediaSourcePlayer: React.FC<MediaSourcePlayerProps> = ({
  streamerSlug,
  streamerName,
  tableName,
  browserSourcePath,
  brandColor = '#3b82f6',
  Icon,
}) => {
  const [obsToken, setObsToken] = useState('');
  const [isValidToken, setIsValidToken] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [queueCount, setQueueCount] = useState(0);

  const { config } = usePusherConfig(streamerSlug);

  // Connect to Pusher to show real-time queue updates
  const { queueSize, connectionStatus } = usePusherAudioQueue({
    streamerSlug,
    pusherKey: config?.key || '',
    pusherCluster: config?.cluster || '',
    onNewAudioMessage: () => {
      setQueueCount(prev => prev + 1);
    },
  });

  // Validate token on input
  const validateToken = async () => {
    if (!obsToken.trim()) return;
    
    setIsValidating(true);
    try {
      const { data, error } = await supabase.rpc('validate_obs_token_secure', {
        token_to_check: obsToken.trim()
      });
      
      if (!error && data?.[0]?.is_valid && data[0].streamer_slug === streamerSlug) {
        setIsValidToken(true);
      } else {
        setIsValidToken(false);
      }
    } catch (err) {
      console.error('Token validation error:', err);
      setIsValidToken(false);
    }
    setIsValidating(false);
  };

  // Fetch current queue count
  const fetchQueueCount = async () => {
    const { count, error } = await supabase
      .from(tableName as any)
      .select('*', { count: 'exact', head: true })
      .is('audio_played_at', null)
      .in('moderation_status', ['approved', 'auto_approved'])
      .eq('payment_status', 'success')
      .or('tts_audio_url.not.is.null,voice_message_url.not.is.null');

    if (!error && count !== null) {
      setQueueCount(count);
    }
  };

  useEffect(() => {
    fetchQueueCount();
    const interval = setInterval(fetchQueueCount, 10000);
    return () => clearInterval(interval);
  }, [tableName]);

  // Use the generic edge function
  const mediaSourceUrl = `${SUPABASE_PROJECT_URL}/functions/v1/get-current-audio?token=${obsToken}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mediaSourceUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2" style={{ color: brandColor }}>
            {Icon && <Icon className="w-6 h-6" />}
            {streamerName} Media Source Audio
          </h1>
          <p className="text-sm text-muted-foreground">
            Alternative to Browser Source - Uses OBS Media Source for audio playback
          </p>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              Status
              <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
                {connectionStatus}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Audio Queue</span>
              <span className="font-semibold">{queueCount} pending</span>
            </div>
            <Button variant="outline" size="sm" onClick={fetchQueueCount} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Queue
            </Button>
          </CardContent>
        </Card>

        {/* Token Input */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Enter OBS Token</CardTitle>
            <CardDescription>
              Use the same token from your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Paste your OBS token..."
                value={obsToken}
                onChange={(e) => {
                  setObsToken(e.target.value);
                  setIsValidToken(false);
                }}
              />
              <Button onClick={validateToken} disabled={isValidating || !obsToken.trim()}>
                {isValidating ? 'Checking...' : 'Validate'}
              </Button>
            </div>
            {obsToken && (
              <Badge variant={isValidToken ? 'default' : 'destructive'}>
                {isValidToken ? '✓ Valid Token' : `✗ Invalid or Not ${streamerName} Token`}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Media Source URL */}
        {isValidToken && (
          <Card style={{ borderColor: brandColor }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg" style={{ color: brandColor }}>Media Source URL</CardTitle>
              <CardDescription>
                Use this URL in OBS Media Source
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={mediaSourceUrl}
                  className="font-mono text-xs"
                />
                <Button onClick={copyToClipboard} variant="outline">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="w-5 h-5" />
              OBS Setup Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
              <li>
                In OBS, go to <strong>Sources</strong> → <strong>Add</strong> → <strong>Media Source</strong>
              </li>
              <li>
                Name it something like <strong>"{streamerName} Audio Alerts"</strong>
              </li>
              <li>
                Check <strong>"Local File"</strong> is <strong>UNCHECKED</strong>
              </li>
              <li>
                Paste the Media Source URL above into the <strong>"Input"</strong> field
              </li>
              <li>
                Set these recommended settings:
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Check <strong>"Restart playback when source becomes active"</strong></li>
                  <li>Check <strong>"Close file when inactive"</strong></li>
                  <li>Set <strong>"Network Buffering"</strong> to 100-500 MB</li>
                </ul>
              </li>
              <li>
                Click <strong>OK</strong> to save
              </li>
              <li>
                <strong>Important:</strong> Set up a <strong>Scene Transition</strong> or <strong>Hotkey</strong> to reload the Media Source every few seconds to poll for new audio
              </li>
            </ol>

            <div className="mt-4 p-3 bg-muted rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong>Note:</strong> The Media Source will play one audio at a time. Each time it's refreshed/reloaded, it will fetch the next audio in the queue. Consider using an Advanced Scene Switcher plugin or similar to auto-reload the source every 3-5 seconds when there are donations.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alternative Browser Source */}
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              Still having issues? Try the regular{' '}
              <a href={browserSourcePath} className="underline" style={{ color: brandColor }}>
                Browser Source Audio Player
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MediaSourcePlayer;
