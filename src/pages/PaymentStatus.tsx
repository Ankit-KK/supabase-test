
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { verifyPayment, createDonationRecord } from "@/services/paymentService";
import { toast } from "@/hooks/use-toast";

const PaymentStatus = () => {
  const [verificationStatus, setVerificationStatus] = useState("verifying");
  const [paymentStatus, setPaymentStatus] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const status = query.get("status");
    const orderId = query.get("order_id");

    // Check payment status first from URL
    if (status && orderId) {
      setPaymentStatus(status);

      // If payment was successful, verify it on the backend and create donation record
      if (status === "success") {
        verifyAndCreateRecord(orderId);
      } else {
        setVerificationStatus("failed");
      }
    } else {
      setVerificationStatus("failed");
      toast({
        title: "Error",
        description: "Missing payment information",
        variant: "destructive",
      });
    }
  }, [location]);

  const verifyAndCreateRecord = async (orderId: string) => {
    try {
      // Verify payment with backend
      const verificationResult = await verifyPayment(orderId);
      
      if (verificationResult && verificationResult.status === "success") {
        // Get donation data from session storage
        const donationDataStr = sessionStorage.getItem("donationData");
        
        if (donationDataStr) {
          const donationData = JSON.parse(donationDataStr);
          
          // Create donation record in database
          await createDonationRecord({
            name: donationData.name,
            amount: donationData.amount,
            message: donationData.message,
            order_id: donationData.orderId,
            payment_status: "success",
            donationType: donationData.donationType || "ankit",
            include_sound: donationData.includeSoundLink ? true : undefined
          });
          
          setVerificationStatus("success");
          toast({
            title: "Payment Verified",
            description: "Your donation has been successfully verified",
          });
        } else {
          setVerificationStatus("failed");
          toast({
            title: "Error",
            description: "Donation data not found",
            variant: "destructive",
          });
        }
      } else {
        setVerificationStatus("failed");
        toast({
          title: "Verification Failed",
          description: "Payment verification failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      setVerificationStatus("failed");
      toast({
        title: "Error",
        description: "Failed to verify payment",
        variant: "destructive",
      });
    }
  };

  const getDonationType = () => {
    const donationDataStr = sessionStorage.getItem("donationData");
    if (donationDataStr) {
      const donationData = JSON.parse(donationDataStr);
      return donationData.donationType || "ankit";
    }
    return "ankit";
  };

  const handleReturn = () => {
    const donationType = getDonationType();
    if (donationType === "harish") {
      navigate("/harish");
    } else if (donationType === "mackle") {
      navigate("/mackle");
    } else {
      navigate("/ankit");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold mb-6">Payment Status</h1>
        
        {verificationStatus === "verifying" && (
          <div className="mb-6">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Verifying your payment...</p>
          </div>
        )}
        
        {verificationStatus === "success" && (
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-600 mb-2">Payment Successful</h2>
            <p className="text-gray-600">Thank you for your donation!</p>
          </div>
        )}
        
        {verificationStatus === "failed" && (
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-600 mb-2">Payment Failed</h2>
            <p className="text-gray-600">{paymentStatus === "aborted" ? "Payment was aborted." : "There was an issue with your payment."}</p>
          </div>
        )}
        
        <Button onClick={handleReturn} className="w-full">
          Return to Donation Page
        </Button>
      </div>
    </div>
  );
};

export default PaymentStatus;
