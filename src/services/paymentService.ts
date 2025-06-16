
import { supabase } from "@/integrations/supabase/client";

export interface DonationData {
  name: string;
  amount: number;
  message: string;
  orderId: string;
  donationType: "general" | "ankit" | "chiaa_gaming";
  gifUrl?: string | null;
  gifFileName?: string | null;
  gifFileSize?: number | null;
  voiceUrl?: string | null;
  voiceFileName?: string | null;
  voiceFileSize?: number | null;
  include_sound?: boolean;
  customSoundId?: string | null;
  customSoundName?: string | null;
  customSoundUrl?: string | null;
}

export const createPaymentOrder = async (donationData: DonationData) => {
  try {
    console.log("Creating payment order with data:", donationData);
    
    const { data, error } = await supabase.functions.invoke('create-payment-order', {
      body: donationData
    });

    if (error) {
      console.error("Error creating payment order:", error);
      throw error;
    }

    console.log("Payment order created:", data);
    return data;
  } catch (error) {
    console.error("Payment service error:", error);
    throw error;
  }
};

export const verifyPayment = async (orderId: string) => {
  try {
    console.log("Verifying payment for order ID:", orderId);
    
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: { orderId }
    });

    if (error) {
      console.error("Error verifying payment:", error);
      throw error;
    }

    console.log("Payment verification result:", data);
    return data;
  } catch (error) {
    console.error("Payment verification error:", error);
    throw error;
  }
};

export const createDonationRecord = async (donationData: {
  name: string;
  amount: number;
  message: string;
  order_id: string;
  payment_status: string;
  donationType: string;
  gifUrl?: string | null;
  gifFileName?: string | null;
  gifFileSize?: number | null;
  voiceUrl?: string | null;
  voiceFileName?: string | null;
  voiceFileSize?: number | null;
  include_sound?: boolean;
  customSoundId?: string | null;
  customSoundName?: string | null;
  customSoundUrl?: string | null;
}) => {
  try {
    console.log("Creating donation record:", donationData);
    
    // Determine which table to insert into based on donation type
    const tableName = donationData.donationType === 'ankit' ? 'ankit_donations' : 'chiaa_gaming_donations';
    
    if (donationData.donationType === 'ankit') {
      // Insert into ankit_donations table (simpler schema)
      const { data, error } = await supabase
        .from('ankit_donations')
        .insert([{
          name: donationData.name,
          amount: donationData.amount,
          message: donationData.message,
          order_id: donationData.order_id,
          payment_status: donationData.payment_status
        }]);

      if (error) {
        console.error("Error creating ankit donation record:", error);
        throw error;
      }

      console.log("Ankit donation record created successfully:", data);
      return data;
    } else {
      // Insert into chiaa_gaming_donations table (full schema with media and custom sounds)
      console.log("🔊 CUSTOM SOUND: Inserting donation with custom sound data:", {
        customSoundId: donationData.customSoundId,
        customSoundName: donationData.customSoundName,
        customSoundUrl: donationData.customSoundUrl,
        include_sound: donationData.include_sound
      });

      const { data, error } = await supabase
        .from('chiaa_gaming_donations')
        .insert([{
          name: donationData.name,
          amount: donationData.amount,
          message: donationData.message,
          order_id: donationData.order_id,
          payment_status: donationData.payment_status,
          gif_url: donationData.gifUrl,
          voice_url: donationData.voiceUrl,
          voice_file_name: donationData.voiceFileName,
          voice_file_size: donationData.voiceFileSize,
          include_sound: donationData.include_sound || false,
          custom_sound_id: donationData.customSoundId,
          custom_sound_name: donationData.customSoundName,
          custom_sound_url: donationData.customSoundUrl
        }]);

      if (error) {
        console.error("Error creating chiaa gaming donation record:", error);
        throw error;
      }

      console.log("🎵 CUSTOM SOUND: Chiaa gaming donation record created successfully with custom sound data:", data);
      return data;
    }
  } catch (error) {
    console.error("Error in createDonationRecord:", error);
    throw error;
  }
};
