import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Donation {
  id: string;
  name: string;
  amount: number;
  message: string;
  voice_message_url?: string;
  created_at: string;
  is_hyperemote: boolean;
}

interface AlertSystemConfig {
  streamerId: string;
  tableName: string;
  pollInterval?: number;
  enabled?: boolean;
}

export const useSimpleAlerts = ({ streamerId, tableName, pollInterval = 2000, enabled = true }: AlertSystemConfig) => {
  const [currentAlert, setCurrentAlert] = useState<Donation | null>(null);
  const [lastShownId, setLastShownId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const fetchLatestDonation = useCallback(async () => {
    // Don't fetch if disabled or no streamer ID
    if (!enabled || !streamerId) {
      console.log(`⏸️ Alert system disabled - enabled: ${enabled}, streamerId: ${streamerId}`);
      return;
    }

    try {
      console.log(`🔄 Polling ${tableName} for streamerId: ${streamerId}`);
      
      // Use dynamic query based on table name to avoid TypeScript issues
      let query;
      if (tableName === 'ankit_donations') {
        query = supabase
          .from('ankit_donations')
          .select('id, name, amount, message, voice_message_url, created_at, is_hyperemote');
      } else if (tableName === 'chia_gaming_donations') {
        query = supabase
          .from('chia_gaming_donations')
          .select('id, name, amount, message, voice_message_url, created_at, is_hyperemote');
      } else {
        query = supabase
          .from('demostreamer_donations')
          .select('id, name, amount, message, voice_message_url, created_at, is_hyperemote');
      }

      const { data, error } = await query
        .eq('streamer_id', streamerId)
        .eq('payment_status', 'success')
        .in('moderation_status', ['approved', 'auto_approved'])
        .eq('message_visible', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('❌ Error fetching donations:', error);
        setConnectionStatus('error');
        return;
      }

      setConnectionStatus('connected');

      if (!data || data.length === 0) {
        console.log('📭 No donations found');
        return;
      }

      const latestDonation = data[0] as Donation;
      console.log('📦 Latest donation:', latestDonation);
      console.log('🔍 Debug state - lastShownId:', lastShownId, 'currentAlert:', !!currentAlert, 'isFirstLoad:', isFirstLoad);

      // Show alert if this is a new donation OR if it's the first load and we haven't shown any alerts yet
      const shouldShowAlert = isFirstLoad || (latestDonation.id !== lastShownId && !currentAlert);
      
      if (shouldShowAlert) {
        console.log('🚨 Showing alert:', latestDonation.name, '₹' + latestDonation.amount, 'Reason:', isFirstLoad ? 'First load' : 'New donation');
        setCurrentAlert(latestDonation);
        setIsVisible(true);
        setLastShownId(latestDonation.id);
        setIsFirstLoad(false);

        // Auto-hide after appropriate duration
        const duration = latestDonation.voice_message_url ? 10000 : 
                        latestDonation.is_hyperemote ? 6000 : 5000;
        
        setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => setCurrentAlert(null), 500); // Allow fade out
        }, duration);
      } else {
        console.log('⏭️ Skipping alert - already shown or currently displaying');
      }

    } catch (error) {
      console.error('❌ Polling error:', error);
      setConnectionStatus('error');
    }
  }, [streamerId, tableName, lastShownId, currentAlert, enabled, isFirstLoad]);

  // Start polling
  useEffect(() => {
    if (!enabled || !streamerId) {
      console.log(`⏸️ Alert system not started - enabled: ${enabled}, streamerId: ${streamerId}`);
      return;
    }

    console.log(`🎯 Starting alert system for ${tableName} with streamerId: ${streamerId}`);
    
    // Initial fetch
    fetchLatestDonation();
    
    // Setup polling
    const interval = setInterval(fetchLatestDonation, pollInterval);
    
    return () => {
      console.log(`🛑 Stopping alert system for ${tableName}`);
      clearInterval(interval);
    };
  }, [fetchLatestDonation, pollInterval, enabled, streamerId]);

  const triggerTestAlert = useCallback(() => {
    const testAlert: Donation = {
      id: `test-${Date.now()}`,
      name: 'Test Donor',
      amount: 100,
      message: 'This is a test alert! 🎉',
      created_at: new Date().toISOString(),
      is_hyperemote: false
    };
    
    console.log('🧪 Triggering test alert');
    setCurrentAlert(testAlert);
    setIsVisible(true);
    
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setCurrentAlert(null), 500);
    }, 5000);
  }, []);

  const resetAlertState = useCallback(() => {
    console.log('🔄 Resetting alert state');
    setCurrentAlert(null);
    setLastShownId(null);
    setIsVisible(false);
    setIsFirstLoad(true);
  }, []);

  return {
    currentAlert,
    isVisible,
    connectionStatus,
    triggerTestAlert,
    resetAlertState
  };
};