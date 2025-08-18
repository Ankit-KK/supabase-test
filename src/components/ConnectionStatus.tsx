import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, XCircle, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ConnectionStatus = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Test basic connection
        const { data, error } = await supabase.from('streamers').select('count').limit(1);
        
        if (error) {
          setStatus('error');
          setError(`Database Error: ${error.message}`);
          return;
        }

        setStatus('connected');
      } catch (err) {
        setStatus('error');
        setError(`Connection Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    checkConnection();
  }, []);

  const handleReconnect = async () => {
    setStatus('checking');
    setError('');
    
    try {
      const { data, error } = await supabase.from('streamers').select('count').limit(1);
      
      if (error) {
        setStatus('error');
        setError(`Database Error: ${error.message}`);
        return;
      }

      setStatus('connected');
    } catch (err) {
      setStatus('error');
      setError(`Connection Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const getButtonVariant = () => {
    switch (status) {
      case 'checking':
        return 'secondary';
      case 'connected':
        return 'default';
      case 'error':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getButtonIcon = () => {
    switch (status) {
      case 'checking':
        return <Wifi className="h-3 w-3 animate-pulse" />;
      case 'connected':
        return <CheckCircle className="h-3 w-3" />;
      case 'error':
        return <XCircle className="h-3 w-3" />;
    }
  };

  const getButtonText = () => {
    switch (status) {
      case 'checking':
        return 'Connecting';
      case 'connected':
        return 'Live';
      case 'error':
        return 'Reconnect';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant={getButtonVariant()}
        size="sm"
        onClick={status === 'error' ? handleReconnect : undefined}
        className="gap-1.5 text-xs shadow-lg"
        disabled={status === 'checking'}
      >
        {getButtonIcon()}
        {getButtonText()}
      </Button>
    </div>
  );
};