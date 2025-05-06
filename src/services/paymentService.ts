
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function verifyPaymentStatus(orderId: string) {
  try {
    console.log("Checking payment status for order:", orderId);
    
    // Call our edge function to verify payment status
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: { orderId }
    });

    if (error) {
      console.error("Error verifying payment:", error);
      toast.error("Error verifying payment status");
      return { status: 'error', data: null };
    }

    console.log("Payment verification response:", data);
    
    // Determine payment status based on the payments data
    let orderStatus;
    
    // Check if we have payment data in the expected format
    if (data.payments && Array.isArray(data.payments)) {
      // Use the filters as specified in the instructions
      if (data.payments.filter((transaction: any) => transaction.payment_status === "SUCCESS").length > 0) {
        orderStatus = "success";
      } else if (data.payments.filter((transaction: any) => transaction.payment_status === "PENDING").length > 0) {
        orderStatus = "pending";
      } else {
        orderStatus = "failed";
      }
    } else if (data.order) {
      // Fallback to order status if payments data is not available
      if (data.order.order_status === "PAID") {
        orderStatus = "success";
      } else if (data.order.order_status === "ACTIVE") {
        orderStatus = "pending";
      } else {
        orderStatus = "failed";
      }
    } else {
      // Legacy format handling (direct order data)
      if (data.order_status === "PAID") {
        orderStatus = "success";
      } else if (data.order_status === "ACTIVE") {
        orderStatus = "pending";
      } else {
        orderStatus = "failed";
      }
    }
    
    console.log("Determined payment status:", orderStatus);
    return { status: orderStatus, data };
  } catch (err) {
    console.error("Error checking payment status:", err);
    toast.error("An unexpected error occurred");
    return { status: 'error', data: null };
  }
}

export async function createDonationRecord(donationData: any, orderId: string, paymentStatus: string) {
  // Only create/update a database record if we're on the Success page
  // Map payment status to database status
  let dbStatus = 'pending';
  if (paymentStatus === "success") {
    dbStatus = 'completed';
    toast.success("Payment completed successfully!");
  } else if (paymentStatus === "failed") {
    dbStatus = 'failed';
    toast.error("Payment failed");
  } else {
    toast.info("Payment is pending verification");
  }
  
  try {
    console.log("Creating donation record with status:", dbStatus, "for order ID:", orderId);
    const { error: insertError } = await supabase
      .from("donations")
      .insert({
        name: donationData.name,
        amount: donationData.amount,
        message: donationData.message,
        order_id: orderId,
        payment_status: dbStatus
      });
    
    if (insertError) {
      console.error("Error creating donation record:", insertError);
      toast.error("Failed to save your donation details");
      return false;
    } else {
      console.log("Donation record created successfully with status:", dbStatus);
      
      // Mark the donation as processed in session storage to prevent duplicate entries
      const updatedData = { ...donationData, isProcessed: true };
      sessionStorage.setItem('donation_data', JSON.stringify(updatedData));
      return true;
    }
  } catch (dbErr) {
    console.error("Error processing donation data:", dbErr);
    toast.error("Failed to process donation data");
    return false;
  }
}

export function getDonationDataFromStorage() {
  const storedData = sessionStorage.getItem('donation_data');
  if (!storedData) {
    console.error("No donation data found in session storage");
    return null;
  }
  
  return JSON.parse(storedData);
}
