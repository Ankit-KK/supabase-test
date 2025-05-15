
import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { verifyPayment, createDonationRecord } from "@/services/paymentService";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";

const PaymentStatus = () => {
  const [status, setStatus] = useState<"loading" | "success" | "failed" | "pending">("loading");
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [isRecordCreated, setIsRecordCreated] = useState(false);
  const [donationType, setDonationType] = useState<"ankit" | "harish" | "mackle" | null>(null);
  const [isVerificationComplete, setIsVerificationComplete] = useState(false);
  
  const location = useLocation();
  
  useEffect(() => {
    const verifyAndRecordPayment = async () => {
      try {
        // Get the order_id from URL query params
        const searchParams = new URLSearchParams(location.search);
        const orderId = searchParams.get("order_id");
        
        if (!orderId) {
          toast({
            title: "Error",
            description: "Order ID not found in URL",
            variant: "destructive",
          });
          setStatus("failed");
          setIsVerificationComplete(true);
          return;
        }

        // Determine donation type from order ID
        let donationType: "ankit" | "harish" | "mackle" = "ankit";
        if (orderId.startsWith("harish_")) {
          donationType = "harish";
        } else if (orderId.startsWith("mackle_")) {
          donationType = "mackle";
        } else if (orderId.startsWith("ankit_")) {
          donationType = "ankit";
        }
        
        setDonationType(donationType);

        // Get donation data from session storage
        const donationDataStr = sessionStorage.getItem("donationData");
        if (!donationDataStr) {
          toast({
            title: "Error",
            description: "No donation data found",
            variant: "destructive",
          });
          setStatus("failed");
          setIsVerificationComplete(true);
          return;
        }

        const donationData = JSON.parse(donationDataStr);
        console.log("Donation data from session storage:", donationData);
        
        // Verify payment status using Supabase Edge Function
        const verificationResult = await verifyPayment(orderId);
        console.log("Payment verification result:", verificationResult);
        
        if (!verificationResult) {
          toast({
            title: "Error",
            description: "Failed to verify payment status",
            variant: "destructive",
          });
          setStatus("failed");
          setIsVerificationComplete(true);
          return;
        }

        setPaymentDetails(verificationResult);
        
        // Determine payment status based on order status first
        // This is important since payments array might be empty if payment wasn't attempted
        let paymentStatus = "failed";
        
        // First check the order status - this is the most reliable indicator
        if (verificationResult.order && verificationResult.order.order_status === "PAID") {
          paymentStatus = "success";
        } 
        // Then check if we have payments and their statuses
        else if (verificationResult.payments && verificationResult.payments.length > 0) {
          // Look for any successful payment
          if (verificationResult.payments.some((tx: any) => tx.payment_status === "SUCCESS")) {
            paymentStatus = "success";
          } else if (verificationResult.payments.some((tx: any) => tx.payment_status === "PENDING")) {
            paymentStatus = "pending";
          } else {
            paymentStatus = "failed";
          }
        } 
        // If order is active but no payments, it might be pending
        else if (verificationResult.order && verificationResult.order.order_status === "ACTIVE") {
          paymentStatus = "pending";
        } else {
          paymentStatus = "failed";
        }
        
        // Log the detected payment status for debugging
        console.log("Detected payment status:", paymentStatus);
        
        // Set component status based on payment status
        if (paymentStatus === "success") {
          setStatus("success");
        } else if (paymentStatus === "pending") {
          setStatus("pending");
        } else {
          setStatus("failed");
        }
        
        // Create donation record in Supabase only after payment verification
        if (!isRecordCreated) {
          // Prepare donation record data with include_sound if available
          const recordData = {
            name: donationData.name,
            amount: donationData.amount,
            message: donationData.message,
            order_id: orderId,
            payment_status: paymentStatus,
            donationType: donationType
          };
          
          // Add include_sound field if it exists in the donation data
          if (donationType === "mackle" && donationData.include_sound !== undefined) {
            // @ts-ignore - We know include_sound exists on mackle donations
            recordData.include_sound = !!donationData.include_sound;
          }
          
          await createDonationRecord(recordData);
          setIsRecordCreated(true);
        }
        
        setIsVerificationComplete(true);

      } catch (error) {
        console.error("Error verifying payment:", error);
        toast({
          title: "Verification Error",
          description: "Failed to verify payment status. Please contact support.",
          variant: "destructive",
        });
        setStatus("failed");
        setIsVerificationComplete(true);
      }
    };

    if (!isVerificationComplete) {
      verifyAndRecordPayment();
    }
  }, [location.search, isRecordCreated, isVerificationComplete]);

  const getReturnLink = () => {
    if (donationType === "harish") {
      return "/harish";
    } else if (donationType === "mackle") {
      return "/mackle";
    }
    return "/ankit";
  };

  return (
    <div className="container mx-auto max-w-md py-10">
      <div className="border rounded-lg p-8 shadow-sm text-center space-y-6">
        {status === "loading" && (
          <>
            <div className="flex justify-center">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Verifying Payment</h1>
            <p className="text-muted-foreground">
              Please wait while we verify your payment status...
            </p>
          </>
        )}
        
        {status === "success" && isVerificationComplete && (
          <>
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-green-500">Payment Successful</h1>
            <p className="text-muted-foreground">
              Thank you for your donation! Your payment has been successfully processed.
            </p>
            {paymentDetails && (
              <div className="text-left bg-gray-50 rounded p-4 text-sm">
                <p><span className="font-medium">Order ID:</span> {paymentDetails.order.order_id}</p>
                <p><span className="font-medium">Amount:</span> ₹{paymentDetails.order.order_amount}</p>
                <p>
                  <span className="font-medium">Donation for:</span> 
                  {donationType === "harish" 
                    ? "Harish" 
                    : donationType === "mackle" 
                      ? "Mackle" 
                      : "Ankit"}
                </p>
              </div>
            )}
          </>
        )}
        
        {status === "pending" && isVerificationComplete && (
          <>
            <div className="flex justify-center">
              <AlertTriangle className="h-16 w-16 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold text-yellow-500">Payment Pending</h1>
            <p className="text-muted-foreground">
              Your payment is being processed. We'll update you once it's complete.
            </p>
          </>
        )}
        
        {status === "failed" && isVerificationComplete && (
          <>
            <div className="flex justify-center">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-red-500">Payment Failed</h1>
            <p className="text-muted-foreground">
              We couldn't process your payment. Please try again or use a different payment method.
            </p>
          </>
        )}
        
        {isVerificationComplete && (
          <div className="pt-4">
            <Link to={getReturnLink()}>
              <Button variant="outline">Make Another Donation</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentStatus;
