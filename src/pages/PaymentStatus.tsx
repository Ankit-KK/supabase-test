
import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { verifyPayment, createDonationRecord } from "@/services/paymentService";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";

const PaymentStatus = () => {
  const [status, setStatus] = useState<"loading" | "success" | "failed" | "pending">("loading");
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [isRecordCreated, setIsRecordCreated] = useState(false);
  const [donationType, setDonationType] = useState<"ankit" | "harish" | null>(null);
  
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
          return;
        }

        // Determine donation type from order ID
        let donationType: "ankit" | "harish" = "ankit";
        if (orderId.startsWith("harish_")) {
          donationType = "harish";
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
          return;
        }

        const donationData = JSON.parse(donationDataStr);
        
        // Verify payment status using Supabase Edge Function
        const verificationResult = await verifyPayment(orderId);
        
        if (!verificationResult || !verificationResult.payments) {
          toast({
            title: "Error",
            description: "Failed to verify payment status",
            variant: "destructive",
          });
          setStatus("failed");
          return;
        }

        setPaymentDetails(verificationResult);
        
        // Determine payment status
        const payments = verificationResult.payments;
        let paymentStatus = "failed";
        
        if (payments.some((tx: any) => tx.payment_status === "SUCCESS")) {
          paymentStatus = "success";
          setStatus("success");
        } else if (payments.some((tx: any) => tx.payment_status === "PENDING")) {
          paymentStatus = "pending";
          setStatus("pending");
        } else {
          paymentStatus = "failed";
          setStatus("failed");
        }

        // Create donation record in Supabase only after payment verification
        if (!isRecordCreated) {
          await createDonationRecord({
            name: donationData.name,
            amount: donationData.amount,
            message: donationData.message,
            order_id: orderId,
            payment_status: paymentStatus,
            donationType: donationType
          });
          setIsRecordCreated(true);
        }

      } catch (error) {
        console.error("Error verifying payment:", error);
        toast({
          title: "Verification Error",
          description: "Failed to verify payment status. Please contact support.",
          variant: "destructive",
        });
        setStatus("failed");
      }
    };

    verifyAndRecordPayment();
  }, [location.search, isRecordCreated]);

  const getReturnLink = () => {
    if (donationType === "harish") {
      return "/harish";
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
        
        {status === "success" && (
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
                <p><span className="font-medium">Donation for:</span> {donationType === "harish" ? "Harish" : "Ankit"}</p>
              </div>
            )}
          </>
        )}
        
        {status === "pending" && (
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
        
        {status === "failed" && (
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
        
        <div className="pt-4">
          <Link to={getReturnLink()}>
            <Button variant="outline">Make Another Donation</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;
