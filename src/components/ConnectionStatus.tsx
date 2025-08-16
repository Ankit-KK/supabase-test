import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

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

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <AlertCircle className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'checking':
        return 'Checking connection...';
      case 'connected':
        return 'Connected to Supabase';
      case 'error':
        return error;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2 text-sm">
        {getStatusIcon()}
        <span className={status === 'error' ? 'text-destructive' : 'text-foreground'}>
          {getStatusText()}
        </span>
      </div>
    </div>
  );
};