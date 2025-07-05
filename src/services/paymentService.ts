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
      // Store in chiaa_gaming_donations table
      const { error } = await supabase
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
          include_sound: data.include_sound || false
        });

      if (error) {
        console.error('Error inserting Chiaa Gaming donation:', error);
        throw error;
      }

      console.log('Successfully inserted Chiaa Gaming donation');
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
