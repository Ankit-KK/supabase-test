
import { supabase } from "@/integrations/supabase/client";

type DonationRecord = {
  name: string;
  amount: number;
  message: string;
  order_id: string;
  payment_status: string;
  donationType: "ankit" | "harish" | "mackletv";
  include_gif?: boolean;
};

/**
 * Creates a payment order via Supabase Edge Function
 */
export const createPaymentOrder = async (orderId: string, amount: number, name: string, donationType: string = "ankit") => {
  try {
    console.log("Creating payment order:", { orderId, amount, name, donationType });
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
 * Only called after payment verification
 */
export const createDonationRecord = async (donation: DonationRecord) => {
  try {
    const tableName = donation.donationType === "harish" 
      ? "harish_donations" 
      : donation.donationType === "mackletv" 
        ? "mackletv_donations" 
        : "ankit_donations";
    
    console.log("Creating donation record in table:", tableName, donation);
    
    // Prepare the donation record with all fields
    const donationRecord = {
      name: donation.name,
      amount: donation.amount,
      message: donation.message || "",
      order_id: donation.order_id,
      payment_status: donation.payment_status,
      include_gif: donation.include_gif || false
    };
    
    console.log("Final donation record to be inserted:", donationRecord);
    
    const { error, data } = await supabase
      .from(tableName)
      .insert(donationRecord)
      .select();

    if (error) {
      console.error(`Error creating donation record in ${tableName}:`, error);
      throw new Error(error.message || `Failed to create donation record in ${tableName}`);
    }

    console.log("Donation record created successfully:", data);

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
