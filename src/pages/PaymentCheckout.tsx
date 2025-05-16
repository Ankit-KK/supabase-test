
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
    donationType: string;
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
      navigate("/");
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
      navigate("/");
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
        paymentData.name,
        paymentData.donationType
      );
      
      if (!orderResponse || !orderResponse.payment_session_id) {
        throw new Error("Failed to create payment order");
      }

      // Initialize Cashfree checkout with inline mode instead of popup
      const cashfree = (window as any).Cashfree({
        mode: "production",
      });
      
      const checkoutOptions = {
        paymentSessionId: orderResponse.payment_session_id,
        redirectTarget: "_self", // Change from _modal to _self for inline mode
      };
      
      cashfree.checkout(checkoutOptions).then((result: any) => {
        if (result.error) {
          console.log("Error in payment:", result.error);
          setIsLoading(false);
        }
        if (result.redirect) {
          console.log("Payment will be redirected");
        }
        if (result.paymentDetails) {
          console.log("Payment has been completed:", result.paymentDetails.paymentMessage);
          navigate("/status?order_id=" + paymentData.orderId);
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
          <div className="h-8 bg-gray-700 rounded w-3/4 mx-auto"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-700 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  const donationTitle = paymentData?.donationType === "harish" 
    ? "Donation to Harish" 
    : paymentData?.donationType === "mackle"
    ? "Donation to Mackle"
    : "Donation to Ankit";

  return (
    <div className="container mx-auto max-w-md py-10">
      <div className="border rounded-lg p-6 shadow-sm space-y-6 bg-card">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Complete Your Payment</h1>
          <p className="text-muted-foreground mt-2">
            You're almost there! Click below to complete your {donationTitle}.
          </p>
        </div>
        
        <div className="space-y-4 border-t border-b py-4 border-border">
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
          <div className="flex justify-between">
            <span>Donation Type:</span>
            <span className="font-medium capitalize">{paymentData?.donationType}</span>
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
          You will be redirected to Cashfree's secure payment gateway
        </p>
      </div>
    </div>
  );
};

export default PaymentCheckout;
