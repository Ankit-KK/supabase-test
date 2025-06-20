import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { verifyPayment, createDonationRecord } from "@/services/paymentService";
import { CheckCircle, XCircle, AlertTriangle, Loader2, FileText, ExternalLink } from "lucide-react";
import { generateReceipt } from "@/utils/receiptGenerator";

const PaymentStatus = () => {
  const [status, setStatus] = useState<"loading" | "success" | "failed" | "pending">("loading");
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [isRecordCreated, setIsRecordCreated] = useState(false);
  const [donationType, setDonationType] = useState<"ankit" | "harish" | "mackle" | "rakazone" | "chiaa_gaming" | null>(null);
  const [isVerificationComplete, setIsVerificationComplete] = useState(false);
  const [donationData, setDonationData] = useState<any>(null);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  
  const location = useLocation();

  // Chiaa Gaming YouTube channel redirect logic
  useEffect(() => {
    if (status === "success" && donationType === "chiaa_gaming" && isVerificationComplete) {
      // Start 15-second countdown
      setRedirectCountdown(15);
      
      const countdownInterval = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval);
            // Redirect to YouTube channel
            redirectToChiaaGamingChannel();
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [status, donationType, isVerificationComplete]);

  const redirectToChiaaGamingChannel = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const channelUrl = isMobile 
      ? "https://youtube.com/@_chiaa_gaming" // Mobile YouTube app URL
      : "https://www.youtube.com/@_chiaa_gaming"; // Desktop URL
    
    window.open(channelUrl, '_blank');
  };

  const handleManualRedirect = () => {
    redirectToChiaaGamingChannel();
  };
  
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
        let donationType: "ankit" | "harish" | "mackle" | "rakazone" | "chiaa_gaming" = "ankit";
        if (orderId.startsWith("harish_")) {
          donationType = "harish";
        } else if (orderId.startsWith("mackle_")) {
          donationType = "mackle";
        } else if (orderId.startsWith("rakazone_")) {
          donationType = "rakazone";
        } else if (orderId.startsWith("chiaa_gaming_")) {
          donationType = "chiaa_gaming";
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
        setDonationData(donationData);
        
        // Verify payment status using enhanced backend verification
        const verificationResult = await verifyPayment(orderId);
        
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
        
        // Use the backend-determined status directly
        const backendStatus = verificationResult.status;
        let componentStatus = "failed";
        
        if (backendStatus === "SUCCESS") {
          componentStatus = "success";
        } else if (backendStatus === "PENDING") {
          componentStatus = "pending";
        } else {
          componentStatus = "failed";
        }
        
        setStatus(componentStatus as "success" | "pending" | "failed");
        
        // Create donation record in Supabase - ALWAYS create record regardless of payment status
        if (!isRecordCreated) {
          // Map backend status to database status
          const dbPaymentStatus = backendStatus.toLowerCase();
          
          // Prepare donation record data
          const recordData = {
            name: donationData.name,
            amount: donationData.amount,
            message: donationData.message,
            order_id: orderId,
            payment_status: dbPaymentStatus,
            donationType: donationData.donationType || donationType,
            // ALWAYS include media data for chiaa_gaming donations, regardless of payment status
            gifUrl: donationData.gifUrl,
            gifFileName: donationData.gifFileName,
            gifFileSize: donationData.gifFileSize,
            voiceUrl: donationData.voiceUrl,
            voiceFileName: donationData.voiceFileName,
            voiceFileSize: donationData.voiceFileSize,
            customSoundUrl: donationData.customSoundUrl
          };
          
          // Add include_sound field if it exists in the donation data
          if ((donationType === "mackle" || donationType === "rakazone" || donationType === "chiaa_gaming") && donationData.include_sound !== undefined) {
            // @ts-ignore - We know include_sound exists on these donation types
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
    } else if (donationType === "rakazone") {
      return "/rakazone";
    } else if (donationType === "chiaa_gaming") {
      return "/chiaa_gaming";
    }
    return "/ankit";
  };

  const handleDownloadReceipt = () => {
    if (!paymentDetails || !donationData) return;

    try {
      // Format the current date
      const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Call receipt generator with donation data
      generateReceipt({
        name: donationData.name,
        amount: donationData.amount,
        orderId: paymentDetails.order.order_id,
        donationType: donationType || 'ankit',
        date: date
      });

      toast({
        title: "Receipt Downloaded",
        description: "Your donation receipt has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error generating receipt:", error);
      toast({
        title: "Error",
        description: "Failed to download receipt. Please try again.",
        variant: "destructive",
      });
    }
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
                      : donationType === "rakazone"
                        ? "Rakazone"
                        : donationType === "chiaa_gaming"
                          ? "Chiaa Gaming"
                          : "Ankit"}
                </p>
              </div>
            )}

            {/* Chiaa Gaming specific redirect notification */}
            {donationType === "chiaa_gaming" && redirectCountdown !== null && (
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-center space-x-2 text-pink-600">
                  <ExternalLink className="h-5 w-5" />
                  <span className="font-medium">Redirecting to Chiaa Gaming Channel</span>
                </div>
                <p className="text-sm text-pink-700">
                  You will be redirected to Chiaa Gaming's YouTube channel in {redirectCountdown} seconds
                </p>
                <Button 
                  onClick={handleManualRedirect}
                  className="bg-pink-500 hover:bg-pink-600 text-white"
                  size="sm"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Visit Channel Now
                </Button>
              </div>
            )}
            
            {/* Download Receipt Button */}
            <Button 
              onClick={handleDownloadReceipt} 
              className="mt-4 w-full"
              variant="outline"
            >
              <FileText className="mr-2 h-4 w-4" />
              Download Receipt
            </Button>
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
            
            {/* Chiaa Gaming channel redirect for failed payments too */}
            {donationType === "chiaa_gaming" && (
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 space-y-3 mt-4">
                <div className="flex items-center justify-center space-x-2 text-pink-600">
                  <ExternalLink className="h-5 w-5" />
                  <span className="font-medium">Visit Chiaa Gaming Channel</span>
                </div>
                <p className="text-sm text-pink-700">
                  Check out Chiaa Gaming's latest content while you're here!
                </p>
                <Button 
                  onClick={handleManualRedirect}
                  className="bg-pink-500 hover:bg-pink-600 text-white"
                  size="sm"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Visit Channel
                </Button>
              </div>
            )}
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
