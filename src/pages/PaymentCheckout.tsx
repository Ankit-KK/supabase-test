
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
        script.onload = () => {
          console.log("Cashfree SDK loaded successfully");
        };
        script.onerror = () => {
          console.error("Failed to load Cashfree SDK");
          toast({
            title: "Error",
            description: "Failed to load payment system. Please try again.",
            variant: "destructive",
          });
        };
        document.body.appendChild(script);
      }
    };

    loadCashfreeScript();

    // Get donation data from session storage
    const donationDataStr = sessionStorage.getItem("donationData");
    if (!donationDataStr) {
      console.error("No donation data found in session storage");
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
      console.log("Loaded donation data:", data);
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
    if (!paymentData) {
      console.error("No payment data available");
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Creating payment order for:", paymentData);
      
      // Create payment order using the correct DonationData interface
      const orderResponse = await createPaymentOrder({
        name: paymentData.name,
        amount: paymentData.amount,
        message: paymentData.message,
        orderId: paymentData.orderId,
        donationType: paymentData.donationType as "general" | "ankit" | "chiaa_gaming"
      });
      
      console.log("Order response:", orderResponse);
      
      if (!orderResponse || !orderResponse.payment_session_id) {
        throw new Error("Failed to create payment order - no payment session ID received");
      }

      // Check if Cashfree SDK is loaded
      if (typeof (window as any).Cashfree === 'undefined') {
        throw new Error("Cashfree SDK not loaded");
      }

      // Initialize Cashfree checkout
      const cashfree = (window as any).Cashfree({
        mode: "production",
      });
      
      console.log("Initializing Cashfree checkout with session ID:", orderResponse.payment_session_id);
      
      const checkoutOptions = {
        paymentSessionId: orderResponse.payment_session_id,
        redirectTarget: "_self",
      };
      
      const result = await cashfree.checkout(checkoutOptions);
      
      console.log("Cashfree checkout result:", result);
      
      if (result.error) {
        console.error("Payment error:", result.error);
        toast({
          title: "Payment Error",
          description: result.error.message || "Payment failed. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      if (result.redirect) {
        console.log("Payment will be redirected");
      }
      
      if (result.paymentDetails) {
        console.log("Payment completed:", result.paymentDetails);
        navigate(`/payment-status?order_id=${paymentData.orderId}`);
      }
      
    } catch (error) {
      console.error("Payment initialization error:", error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  if (isLoading && !paymentData) {
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

  return (
    <div className="container mx-auto max-w-md py-10">
      <div className="border rounded-lg p-6 shadow-sm space-y-6 bg-card">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Complete Your Payment</h1>
          <p className="text-muted-foreground mt-2">
            You're almost there! Click below to complete your donation to Ankit.
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
            <span>Message:</span>
            <span className="font-medium text-sm truncate max-w-[200px]">
              {paymentData?.message}
            </span>
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
          You will be redirected to Cashfree's secure payment gateway
        </p>
      </div>
    </div>
  );
};

export default PaymentCheckout;
