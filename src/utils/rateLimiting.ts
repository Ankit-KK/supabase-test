
import { supabase } from '@/integrations/supabase/client';

export const checkServerRateLimit = async (
  ipAddress: string, 
  endpoint: string, 
  maxRequests: number = 10, 
  windowMinutes: number = 1
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_ip_address: ipAddress,
      p_endpoint: endpoint,
      p_max_requests: maxRequests,
      p_window_minutes: windowMinutes
    });

    if (error) {
      console.error('Rate limit check error:', error);
      // Default to allowing request if rate limit check fails
      return true;
    }

    return data as boolean;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return true;
  }
};

export const logSecurityEvent = async (
  eventType: string,
  eventDetails?: string,
  ipAddress?: string
): Promise<void> => {
  try {
    await supabase.rpc('log_security_event', {
      event_type: eventType,
      event_details: eventDetails,
      ip_address: ipAddress
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};
