import React, { useState, useEffect, useRef } from 'react';
import { FileText, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  const [error, setError] = useState<string | null>(null);
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (transcript || hasTriggered.current) return;
    hasTriggered.current = true;

    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      setError('Session expired');
      return;
    }

    setLoading(true);
    supabase.functions
      .invoke('transcribe-voice-sarvam', {
        body: { voiceUrl, streamerSlug },
        headers: { 'x-auth-token': authToken },
      })
      .then(({ data, error: fnError }) => {
        if (fnError) throw fnError;
        const text = data?.transcript || '(No speech detected)';
        transcriptCache.set(donationId, text);
        setTranscript(text);
      })
      .catch((err: any) => {
        console.error('[VoiceTranscriber] Error:', err);
        setError('Could not transcribe');
      })
      .finally(() => setLoading(false));
  }, [voiceUrl, streamerSlug, donationId, transcript]);

  if (loading) {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" style={{ color: brandColor }} />
        Transcribing...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
        <AlertCircle className="h-3 w-3" />
        {error}
      </div>
    );
  }

  if (!transcript) return null;

  return (
    <div className="mt-2 bg-muted rounded p-2 text-sm text-muted-foreground border border-border">
      <div className="flex items-center gap-1.5 mb-1 text-xs font-medium" style={{ color: brandColor }}>
        <FileText className="h-3 w-3" />
        Transcript
      </div>
      <p className="text-foreground text-sm leading-relaxed">{transcript}</p>
    </div>
  );
};

export default VoiceTranscriber;
