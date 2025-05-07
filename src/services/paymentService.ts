
import { supabase } from "@/integrations/supabase/client";

type DonationRecord = {
  name: string;
  amount: number;
  message: string;
  order_id: string;
  payment_status: string;
};

/**
 * Creates a payment order via Supabase Edge Function
 */
export const createPaymentOrder = async (orderId: string, amount: number, name: string) => {
  try {
    const { data, error } = await supabase.functions.invoke("create-payment-order", {
      body: { orderId, amount, name },
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
    const { error } = await supabase
      .from("donations")
      .insert({
        name: donation.name,
        amount: donation.amount,
        message: donation.message,
        order_id: donation.order_id,
        payment_status: donation.payment_status
      });

    if (error) {
      console.error("Error creating donation record:", error);
      throw new Error(error.message || "Failed to create donation record");
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
