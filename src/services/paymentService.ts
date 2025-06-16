
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
    
    // Only add include_sound for mackle/rakazone/chiaa_gaming donations
    if ((donation.donationType === "mackle" || donation.donationType === "rakazone" || donation.donationType === "chiaa_gaming") && donation.include_sound !== undefined) {
      recordData.include_sound = donation.include_sound;
    }

    // Add gif_url for chiaa_gaming donations - ENSURE it's properly included
    if (donation.donationType === "chiaa_gaming" && donation.gifUrl) {
      recordData.gif_url = donation.gifUrl;
      console.log("IMPORTANT: Adding GIF URL to donation record:", {
        gifUrl: donation.gifUrl,
        orderId: donation.order_id,
        recordData: recordData
      });
    } else if (donation.donationType === "chiaa_gaming") {
      console.log("WARNING: No GIF URL provided for chiaa_gaming donation:", {
        orderId: donation.order_id,
        hasGifUrl: !!donation.gifUrl,
        gifUrl: donation.gifUrl
      });
    }
    
    console.log(`Creating ${tableName} record with data:`, recordData);
    console.log("Payment status being saved:", donation.payment_status);
    console.log("GIF URL being saved:", recordData.gif_url);
    
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
    const validatedData = data as { id: string; gif_url?: string; [key: string]: any };
    
    console.log(`Successfully created donation record in ${tableName}:`, validatedData);
    console.log("VERIFICATION: GIF URL in created record:", validatedData.gif_url);

    // Create donation_gifs record if GIF was uploaded for chiaa_gaming
    if (donation.donationType === "chiaa_gaming" && donation.gifUrl && donation.gifFileName && donation.gifFileSize) {
      console.log("Creating donation_gifs record for donation ID:", validatedData.id);
      console.log("GIF details:", {
        gifUrl: donation.gifUrl,
        fileName: donation.gifFileName,
        fileSize: donation.gifFileSize
      });
      
      const { error: gifRecordError } = await supabase
        .from('donation_gifs')
        .insert({
          donation_id: validatedData.id,
          gif_url: donation.gifUrl,
          file_name: donation.gifFileName,
          file_size: donation.gifFileSize,
          status: 'uploaded'
        });

      if (gifRecordError) {
        console.error("Error creating GIF record:", gifRecordError);
        // Don't throw error here - donation was successful, GIF record is secondary
      } else {
        console.log("Successfully created donation_gifs record with URL:", donation.gifUrl);
      }
    } else if (donation.donationType === "chiaa_gaming") {
      console.log("No GIF to create record for:", {
        hasGifUrl: !!donation.gifUrl,
        hasFileName: !!donation.gifFileName,
        hasFileSize: !!donation.gifFileSize
      });
    }

    // Clean up session storage after successful record creation
    // Only clean up for successful payments in production, but keep for testing
    if (donation.payment_status === "success") {
      sessionStorage.removeItem("donationData");
      console.log("Cleaned up session storage");
    }

    return true;
  } catch (error) {
    console.error("Error in createDonationRecord:", error);
    throw error;
  }
};
