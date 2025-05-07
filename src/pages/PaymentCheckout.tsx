
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { createPaymentOrder } from "@/services/paymentService";

const PaymentCheckout = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<{
    name: string;
    amount: number;
    message: string;
    orderId: string;
  } | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Load the Cashfree SDK script
    const loadCashfreeScript = () => {
      const existingScript = document.getElementById("cashfree-script");
      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
        script.id = "cashfree-script";
        script.async = true;
        document.body.appendChild(script);
      }
    };

    loadCashfreeScript();

    // Get donation data from session storage
    const donationDataStr = sessionStorage.getItem("donationData");
    if (!donationDataStr) {
      toast({
        title: "Error",
        description: "No donation data found. Please start again.",
        variant: "destructive",
      });
      navigate("/ankit");
      return;
    }

    try {
      const data = JSON.parse(donationDataStr);
      setPaymentData(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error parsing donation data:", error);
      toast({
        title: "Error",
        description: "Invalid donation data. Please start again.",
        variant: "destructive",
      });
      navigate("/ankit");
    }
  }, [navigate]);

  const handlePayNow = async () => {
    if (!paymentData) return;
    
    setIsLoading(true);
    try {
      // Create payment order using Supabase Edge Function
      const orderResponse = await createPaymentOrder(
        paymentData.orderId, 
        paymentData.amount,
        paymentData.name
      );
      
      if (!orderResponse || !orderResponse.payment_session_id) {
        throw new Error("Failed to create payment order");
      }

      // Initialize Cashfree checkout
      const cashfree = (window as any).Cashfree({
        mode: "production",
      });
      
      const checkoutOptions = {
        paymentSessionId: orderResponse.payment_session_id,
        redirectTarget: "_modal",
      };
      
      // Open Cashfree checkout as a modal popup
      cashfree.checkout(checkoutOptions).then((result: any) => {
        setIsLoading(false);
        
        if (result.error) {
          // User closed the popup or there was a payment error
          console.error("Payment error or popup closed:", result.error);
          toast({
            title: "Payment Incomplete",
            description: "The payment process was interrupted or an error occurred.",
            variant: "destructive",
          });
        }

        if (result.redirect) {
          // This happens in rare cases when the modal can't be opened
          console.log("Payment will be redirected");
          // The user will be redirected to the return_url automatically
        }

        if (result.paymentDetails) {
          // Payment completed - redirect to status page to verify result
          console.log("Payment completed:", result.paymentDetails);
          toast({
            title: "Payment Processed",
            description: "Verifying your payment status...",
          });
          
          // Get the order_id and navigate to status page
          const orderId = paymentData.orderId;
          navigate(`/status?order_id=${orderId}`);
        }
      });
      
    } catch (error) {
      console.error("Payment initialization error:", error);
      toast({
        title: "Payment Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-md py-20 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md py-10">
      <div className="border rounded-lg p-6 shadow-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Complete Your Payment</h1>
          <p className="text-muted-foreground mt-2">
            You're almost there! Click below to complete your donation.
          </p>
        </div>
        
        <div className="space-y-4 border-t border-b py-4">
          <div className="flex justify-between">
            <span>Name:</span>
            <span className="font-medium">{paymentData?.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount:</span>
            <span className="font-medium">₹{paymentData?.amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Order ID:</span>
            <span className="font-medium text-sm truncate max-w-[200px]">
              {paymentData?.orderId}
            </span>
          </div>
        </div>
        
        <Button 
          onClick={handlePayNow} 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Pay Now"}
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          A secure payment popup will appear to complete your transaction
        </p>
      </div>
    </div>
  );
};

export default PaymentCheckout;
