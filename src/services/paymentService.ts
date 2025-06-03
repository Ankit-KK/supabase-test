
import { supabase } from "@/integrations/supabase/client";

type DonationRecord = {
  name: string;
  amount: number;
  message: string;
  order_id: string;
  payment_status: string;
  donationType: "ankit" | "harish" | "mackle" | "rakazone" | "chiaa_gaming";
  include_sound?: boolean;
};

/**
 * Creates a payment order via Supabase Edge Function
 */
export const createPaymentOrder = async (orderId: string, amount: number, name: string, donationType: string = "ankit") => {
  try {
    const { data, error } = await supabase.functions.invoke("create-payment-order", {
      body: { orderId, amount, name, donationType },
    });

    if (error) {
      console.error("Error creating payment order:", error);
      throw new Error(error.message || "Failed to create payment order");
    }

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
    const { data, error } = await supabase.functions.invoke("verify-payment", {
      body: { orderId },
    });

    if (error) {
      console.error("Error verifying payment:", error);
      throw new Error(error.message || "Failed to verify payment");
    }

    return data;
  } catch (error) {
    console.error("Error in verifyPayment:", error);
    throw error;
  }
};

/**
 * Creates a donation record in Supabase
 * Only called after payment verification
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
    
    console.log(`Creating ${tableName} record with data:`, recordData);
    
    const { error } = await supabase
      .from(tableName)
      .insert(recordData);

    if (error) {
      console.error(`Error creating donation record in ${tableName}:`, error);
      throw new Error(error.message || `Failed to create donation record in ${tableName}`);
    }

    // Clean up session storage after successful record creation
    if (donation.payment_status !== "pending") {
      sessionStorage.removeItem("donationData");
    }

    return true;
  } catch (error) {
    console.error("Error in createDonationRecord:", error);
    throw error;
  }
};
