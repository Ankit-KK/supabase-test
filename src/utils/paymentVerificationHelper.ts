import { supabase } from "@/integrations/supabase/client";

/**
 * Helper function to trigger the payment status updater
 * This can be called manually if needed
 */
export const triggerPaymentStatusUpdate = async (): Promise<{ 
  success: boolean; 
  message: string; 
  data?: any; 
}> => {
  try {
    console.log("Triggering payment status updater function");
    
    const { data, error } = await supabase.functions.invoke('payment-status-updater', {
      body: { trigger: 'manual' }
    });

    if (error) {
      console.error('Error triggering payment status updater:', error);
      return {
        success: false,
        message: `Failed to trigger payment verification: ${error.message}`
      };
    }

    console.log('Payment status updater result:', data);
    return {
      success: true,
      message: `Payment verification completed. Processed: ${data?.processed || 0}, Success: ${data?.successful || 0}, Failed: ${data?.failed || 0}`,
      data
    };

  } catch (error) {
    console.error('Error calling payment status updater:', error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Check if a specific donation needs verification
 */
export const checkDonationVerificationStatus = async (orderId: string): Promise<{
  needsVerification: boolean;
  donationData?: any;
  lastAttempt?: string;
  attempts?: number;
}> => {
  try {
    const { data: donation, error } = await supabase
      .from('chiaa_gaming_donations')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error) {
      console.error('Error fetching donation for verification check:', error);
      return { needsVerification: false };
    }

    const needsVerification = donation && 
      ['pending', 'failed'].includes(donation.payment_status) &&
      donation.auto_verification_enabled &&
      (donation.verification_attempts || 0) < 10;

    return {
      needsVerification,
      donationData: donation,
      lastAttempt: donation?.last_verification_at,
      attempts: donation?.verification_attempts || 0
    };

  } catch (error) {
    console.error('Error checking donation verification status:', error);
    return { needsVerification: false };
  }
};

/**
 * Get all donations that need verification
 */
export const getDonationsNeedingVerification = async (): Promise<{
  donations: any[];
  count: number;
}> => {
  try {
    const { data: donations, error } = await supabase
      .from('chiaa_gaming_donations')
      .select('*')
      .in('payment_status', ['pending', 'failed'])
      .eq('auto_verification_enabled', true)
      .lt('verification_attempts', 10)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching donations needing verification:', error);
      return { donations: [], count: 0 };
    }

    return {
      donations: donations || [],
      count: (donations || []).length
    };

  } catch (error) {
    console.error('Error getting donations needing verification:', error);
    return { donations: [], count: 0 };
  }
};