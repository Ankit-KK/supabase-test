import { supabase } from "@/integrations/supabase/client";

export interface PaymentVerificationResult {
  order: any;
  payments: any[];
  status: string;
  order_id: string;
  payment_verified: boolean;
}

export const verifyPayment = async (orderId: string): Promise<PaymentVerificationResult | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: { orderId }
    });

    if (error) {
      console.error('Payment verification error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Payment verification failed:', error);
    return null;
  }
};

export const createPaymentOrder = async (orderId: string, amount: number, name: string, donationType: string) => {
  try {
    console.log('Creating payment order via Supabase edge function:', { orderId, amount, name, donationType });
    
    const { data, error } = await supabase.functions.invoke('create-payment-order', {
      body: { 
        orderId, 
        amount, 
        name, 
        donationType 
      }
    });

    if (error) {
      console.error('Payment order creation error:', error);
      throw error;
    }

    console.log('Payment order created successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to create payment order:', error);
    throw error;
  }
};

export interface DonationRecordData {
  name: string;
  amount: number;
  message: string;
  order_id: string;
  payment_status: string;
  donationType: string;
  selectedEmoji?: string;
  // Media fields for other streamers
  gifUrl?: string;
  gifFileName?: string;
  gifFileSize?: number;
  voiceUrl?: string;
  voiceFileName?: string;
  voiceFileSize?: number;
  customSoundUrl?: string;
  hyperEmotesEnabled?: boolean;
  include_sound?: boolean;
}

// Enhanced function to store donation data immediately after order creation
export const storeDonationDataImmediately = async (data: DonationRecordData & { 
  cashfreeOrderData?: any, 
  paymentSessionId?: string 
}) => {
  try {
    if (data.donationType === 'chiaa_gaming') {
      // Store all donation data immediately in pending state with verification tracking
      const { data: insertedDonation, error } = await supabase
        .from('chiaa_gaming_donations')
        .insert({
          name: data.name,
          amount: data.amount,
          message: data.message,
          order_id: data.order_id,
          payment_status: 'pending', // Always start as pending
          gif_url: data.gifUrl,
          voice_url: data.voiceUrl,
          voice_file_name: data.voiceFileName,
          voice_file_size: data.voiceFileSize,
          custom_sound_url: data.customSoundUrl,
          hyperemotes_enabled: data.hyperEmotesEnabled || false,
          include_sound: data.include_sound || false,
          review_status: 'pending',
          // New verification tracking fields
          verification_attempts: 0,
          payment_session_id: data.paymentSessionId,
          cashfree_order_data: data.cashfreeOrderData,
          auto_verification_enabled: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing Chiaa Gaming donation data:', error);
        throw error;
      }

      console.log('Successfully stored Chiaa Gaming donation data immediately:', insertedDonation.id);
      return insertedDonation;
    }

    // For other donation types, use existing logic
    return null;
  } catch (error) {
    console.error('Failed to store donation data immediately:', error);
    throw error;
  }
};

export const createDonationRecord = async (data: DonationRecordData) => {
  try {
    // Route to the correct table based on donation type
    if (data.donationType === 'ankit') {
      // Store in ankit_donations table
      const { error } = await supabase
        .from('ankit_donations')
        .insert({
          name: data.name,
          amount: data.amount,
          message: data.message,
          order_id: data.order_id,
          payment_status: data.payment_status,
          selected_emoji: data.selectedEmoji
        });

      if (error) {
        console.error('Error inserting Ankit donation:', error);
        throw error;
      }

      console.log('Successfully inserted Ankit donation into ankit_donations table');
    } else if (data.donationType === 'chiaa_gaming') {
      // For Chiaa Gaming, update existing record instead of creating new one
      const { data: existingDonation, error: fetchError } = await supabase
        .from('chiaa_gaming_donations')
        .select('*')
        .eq('order_id', data.order_id)
        .single();

      if (fetchError || !existingDonation) {
        console.error('No existing donation found for order_id:', data.order_id);
        // Fallback: create new record if not found
        const { data: insertedDonation, error } = await supabase
          .from('chiaa_gaming_donations')
          .insert({
            name: data.name,
            amount: data.amount,
            message: data.message,
            order_id: data.order_id,
            payment_status: data.payment_status,
            gif_url: data.gifUrl,
            voice_url: data.voiceUrl,
            voice_file_name: data.voiceFileName,
            voice_file_size: data.voiceFileSize,
            custom_sound_url: data.customSoundUrl,
            hyperemotes_enabled: data.hyperEmotesEnabled || false,
            include_sound: data.include_sound || false,
            review_status: 'pending'
          })
          .select()
          .single();

        if (error) {
          console.error('Error inserting Chiaa Gaming donation:', error);
          throw error;
        }

        console.log('Successfully inserted new Chiaa Gaming donation');
        return insertedDonation;
      }

      // Update existing record with final payment status and set review_status for failed payments
      const updateData: any = {
        payment_status: data.payment_status,
        last_verification_at: new Date().toISOString()
      };

      // Set review_status to pending for failed payments that need approval
      if (data.payment_status === 'failure') {
        updateData.review_status = 'pending';
      }

      const { data: updatedDonation, error: updateError } = await supabase
        .from('chiaa_gaming_donations')
        .update(updateData)
        .eq('id', existingDonation.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating Chiaa Gaming donation:', updateError);
        throw updateError;
      }

      console.log('Successfully updated Chiaa Gaming donation payment status');

      // Trigger Telegram notification for successful payments OR failed payments that need review
      if ((data.payment_status === 'success' || data.payment_status === 'failure') && updatedDonation) {
        try {
          console.log('Triggering Telegram notification for verified donation:', updatedDonation.id);
          
          const { error: notificationError } = await supabase.functions.invoke('donation-notification', {
            body: {
              type: 'UPDATE',
              table: 'chiaa_gaming_donations',
              record: updatedDonation
            }
          });

          if (notificationError) {
            console.error('Failed to send Telegram notification:', notificationError);
            // Don't throw error - payment was successful, notification failure shouldn't block the flow
          } else {
            console.log('Telegram notification sent successfully');
          }
        } catch (notificationError) {
          console.error('Error sending Telegram notification:', notificationError);
          // Don't throw error - payment was successful, notification failure shouldn't block the flow
        }
      }

      return updatedDonation;
    } else {
      // For other streamers, store in generic donations table
      const { error } = await supabase
        .from('donations')
        .insert({
          name: data.name,
          amount: data.amount,
          message: data.message,
          order_id: data.order_id,
          payment_status: data.payment_status
        });

      if (error) {
        console.error('Error inserting generic donation:', error);
        throw error;
      }

      console.log('Successfully inserted generic donation');
    }
  } catch (error) {
    console.error('Failed to create donation record:', error);
    throw error;
  }
};
