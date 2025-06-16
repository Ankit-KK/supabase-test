
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

export const verifyPayment = async (paymentData: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  donationData: DonationData;
}) => {
  try {
    console.log("Verifying payment with data:", paymentData);
    
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: paymentData
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
