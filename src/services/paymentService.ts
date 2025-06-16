
import { supabase } from "@/integrations/supabase/client";

type DonationRecord = {
  name: string;
  amount: number;
  message: string;
  order_id: string;
  payment_status: string;
  donationType: "ankit" | "harish" | "mackle" | "rakazone" | "chiaa_gaming";
  include_sound?: boolean;
  gifUrl?: string;
  gifFileName?: string;
  gifFileSize?: number;
  voiceUrl?: string;
  voiceFileName?: string;
  voiceFileSize?: number;
  customSoundUrl?: string;
};

/**
 * Creates a payment order via Supabase Edge Function
 */
export const createPaymentOrder = async (orderId: string, amount: number, name: string, donationType: string = "ankit") => {
  try {
    console.log("Creating payment order with:", { orderId, amount, name, donationType });
    
    const { data, error } = await supabase.functions.invoke("create-payment-order", {
      body: { orderId, amount, name, donationType },
    });

    if (error) {
      console.error("Error creating payment order:", error);
      throw new Error(error.message || "Failed to create payment order");
    }

    console.log("Payment order created successfully:", data);
    return data;
  } catch (error) {
    console.error("Error in createPaymentOrder:", error);
    throw error;
  }
};

/**
 * Verifies payment status via Supabase Edge Function
 */
export const verifyPayment = async (orderId: string) => {
  try {
    console.log("Verifying payment for order:", orderId);
    
    const { data, error } = await supabase.functions.invoke("verify-payment", {
      body: { orderId },
    });

    if (error) {
      console.error("Error verifying payment:", error);
      throw new Error(error.message || "Failed to verify payment");
    }

    console.log("Payment verification result:", data);
    return data;
  } catch (error) {
    console.error("Error in verifyPayment:", error);
    throw error;
  }
};

/**
 * Creates a donation record in Supabase
 * Now creates records regardless of payment status for testing purposes
 */
export const createDonationRecord = async (donation: DonationRecord) => {
  try {
    let tableName;
    
    if (donation.donationType === "harish") {
      tableName = "harish_donations";
    } else if (donation.donationType === "mackle") {
      tableName = "mackle_donations";
    } else if (donation.donationType === "rakazone") {
      tableName = "rakazone_donations";
    } else if (donation.donationType === "chiaa_gaming") {
      tableName = "chiaa_gaming_donations";
    } else {
      tableName = "ankit_donations";
    }
    
    const recordData: any = {
      name: donation.name,
      amount: donation.amount,
      message: donation.message,
      order_id: donation.order_id,
      payment_status: donation.payment_status
    };
    
    // For chiaa_gaming donations, handle custom sound and other features
    if (donation.donationType === "chiaa_gaming") {
      // Add custom_sound_url if provided - FOR TESTING: Store even for failed payments
      if (donation.customSoundUrl) {
        recordData.custom_sound_url = donation.customSoundUrl;
        // For testing: Set include_sound to true if custom sound is selected, regardless of payment status
        recordData.include_sound = true;
        console.log("STORING CUSTOM SOUND URL FOR CHIAA GAMING (including failed payments for testing):", {
          customSoundUrl: donation.customSoundUrl,
          include_sound: true,
          orderId: donation.order_id,
          paymentStatus: donation.payment_status
        });
      } else {
        recordData.include_sound = false;
      }

      // Add gif_url for chiaa_gaming donations if provided
      if (donation.gifUrl) {
        recordData.gif_url = donation.gifUrl;
        console.log("STORING GIF URL:", {
          gifUrl: donation.gifUrl,
          orderId: donation.order_id,
          paymentStatus: donation.payment_status
        });
      }

      // Add voice_url for chiaa_gaming donations if provided
      if (donation.voiceUrl) {
        recordData.voice_url = donation.voiceUrl;
        recordData.voice_file_name = donation.voiceFileName;
        recordData.voice_file_size = donation.voiceFileSize;
        console.log("STORING VOICE URL:", {
          voiceUrl: donation.voiceUrl,
          voiceFileName: donation.voiceFileName,
          voiceFileSize: donation.voiceFileSize,
          orderId: donation.order_id,
          paymentStatus: donation.payment_status
        });
      }
    } else {
      // For other donation types (mackle/rakazone), only add include_sound if explicitly provided
      if (donation.include_sound !== undefined) {
        recordData.include_sound = donation.include_sound;
      }
    }
    
    console.log(`Creating ${tableName} record with data:`, recordData);
    console.log("Payment status being saved:", donation.payment_status);
    console.log("Include sound flag:", recordData.include_sound);
    console.log("Custom Sound URL being saved:", recordData.custom_sound_url);
    
    const { data, error } = await supabase
      .from(tableName)
      .insert(recordData)
      .select()
      .single();

    if (error) {
      console.error(`Error creating donation record in ${tableName}:`, error);
      throw new Error(error.message || `Failed to create donation record in ${tableName}`);
    }

    // Combined null check and type validation
    if (!data || typeof data !== 'object' || typeof (data as any).id !== 'string') {
      console.error("Invalid or missing donation record:", data);
      throw new Error("Failed to create donation record - invalid response");
    }

    // Now TypeScript knows data is not null and has the required structure
    const validatedData = data as { id: string; gif_url?: string; voice_url?: string; custom_sound_url?: string; include_sound?: boolean; [key: string]: any };
    
    console.log(`Successfully created donation record in ${tableName}:`, validatedData);
    console.log("VERIFICATION: Custom Sound URL in created record:", validatedData.custom_sound_url);
    console.log("VERIFICATION: Include sound flag in created record:", validatedData.include_sound);

    // Create donation_gifs record if GIF was uploaded for chiaa_gaming
    if (donation.donationType === "chiaa_gaming" && donation.gifUrl && donation.gifFileName && donation.gifFileSize) {
      console.log("Creating donation_gifs record for GIF:", validatedData.id);
      
      const { error: gifRecordError } = await supabase
        .from('donation_gifs')
        .insert({
          donation_id: validatedData.id,
          gif_url: donation.gifUrl,
          file_name: donation.gifFileName,
          file_size: donation.gifFileSize,
          file_type: 'gif',
          status: 'uploaded'
        });

      if (gifRecordError) {
        console.error("Error creating GIF record:", gifRecordError);
        // Don't throw error here - donation was successful, GIF record is secondary
      } else {
        console.log("Successfully created donation_gifs record for GIF:", donation.gifUrl);
      }
    }

    // Create donation_gifs record if Voice was uploaded for chiaa_gaming
    if (donation.donationType === "chiaa_gaming" && donation.voiceUrl && donation.voiceFileName && donation.voiceFileSize) {
      console.log("Creating donation_gifs record for Voice:", validatedData.id);
      
      const { error: voiceRecordError } = await supabase
        .from('donation_gifs')
        .insert({
          donation_id: validatedData.id,
          gif_url: donation.voiceUrl, // Using gif_url column for voice URL as well
          file_name: donation.voiceFileName,
          file_size: donation.voiceFileSize,
          file_type: 'voice',
          status: 'uploaded'
        });

      if (voiceRecordError) {
        console.error("Error creating voice record:", voiceRecordError);
        // Don't throw error here - donation was successful, voice record is secondary
      } else {
        console.log("Successfully created donation_gifs record for voice:", donation.voiceUrl);
      }
    }

    // Clean up session storage only for successful payments
    if (donation.payment_status === "success") {
      sessionStorage.removeItem("donationData");
      console.log("Cleaned up session storage for successful payment");
    } else {
      console.log("Keeping session storage for failed/pending payment - payment status:", donation.payment_status);
    }

    return true;
  } catch (error) {
    console.error("Error in createDonationRecord:", error);
    throw error;
  }
};
