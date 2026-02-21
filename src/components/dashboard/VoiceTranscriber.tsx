import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface VoiceTranscriberProps {
  voiceUrl: string;
  donationId: string;
  streamerSlug: string;
  brandColor?: string;
}

// Local cache so we don't re-transcribe the same donation
const transcriptCache = new Map<string, string>();

const VoiceTranscriber: React.FC<VoiceTranscriberProps> = ({
  voiceUrl,
  donationId,
  streamerSlug,
  brandColor = '#3b82f6',
}) => {
  const [transcript, setTranscript] = useState<string | null>(
    transcriptCache.get(donationId) ?? null
  );
  const [loading, setLoading] = useState(false);

  const handleTranscribe = useCallback(async () => {
    if (transcript) return; // already have it
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      toast({ title: 'Session expired', description: 'Please log in again.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('transcribe-voice-sarvam', {
        body: { voiceUrl, streamerSlug },
        headers: { 'x-auth-token': authToken },
      });

      if (error) throw error;

      const text = data?.transcript || '(No speech detected)';
      transcriptCache.set(donationId, text);
      setTranscript(text);
    } catch (err: any) {
      console.error('[VoiceTranscriber] Error:', err);
      toast({
        title: 'Transcription failed',
        description: err?.message || 'Could not transcribe voice message.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [voiceUrl, streamerSlug, donationId, transcript]);

  return (
    <div className="mt-2">
      {!transcript ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleTranscribe}
          disabled={loading}
          className="text-xs gap-1.5"
          style={{ borderColor: brandColor, color: brandColor }}
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <FileText className="h-3 w-3" />
          )}
          {loading ? 'Transcribing...' : 'Transcribe'}
        </Button>
      ) : (
        <div className="bg-muted rounded p-2 text-sm text-muted-foreground border border-border">
          <div className="flex items-center gap-1.5 mb-1 text-xs font-medium" style={{ color: brandColor }}>
            <FileText className="h-3 w-3" />
            Transcript
          </div>
          <p className="text-foreground text-sm leading-relaxed">{transcript}</p>
        </div>
      )}
    </div>
  );
};

export default VoiceTranscriber;
