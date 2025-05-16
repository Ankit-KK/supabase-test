
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { createPaymentOrder } from "@/services/paymentService";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { CreditCard, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";

const PaymentCheckout = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<{
    name: string;
    amount: number;
    message: string;
    orderId: string;
    donationType: string;
    include_sound?: boolean;
  } | null>(null);
  
  // Min amount for PayPal in INR (equivalent to approximately $10 USD)
  const MIN_PAYPAL_AMOUNT = 800; 
  
  const navigate = useNavigate();
  const form = useForm({
    defaultValues: {
      paymentMethod: "card"
    }
  });

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

  const handlePayNow = async (values: { paymentMethod: string }) => {
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
        components: values.paymentMethod === "paypal" ? ["paypal"] : ["card", "app", "upi", "netbanking"],
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
  
  const isPaypalDisabled = paymentData ? paymentData.amount < MIN_PAYPAL_AMOUNT : true;

  return (
    <div className="container mx-auto max-w-md py-10">
      <Card className="p-6 shadow-sm space-y-6 bg-card">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Complete Your Payment</h1>
          <p className="text-muted-foreground mt-2">
            You're almost there! Choose your payment method to complete your {donationTitle}.
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
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handlePayNow)} className="space-y-6">
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Payment Method</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-3"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="card" id="card" />
                        </FormControl>
                        <FormLabel className="flex items-center gap-2 cursor-pointer font-normal" htmlFor="card">
                          <CreditCard className="h-4 w-4" />
                          <span>Card, UPI, NetBanking & other options</span>
                        </FormLabel>
                      </FormItem>
                      
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem 
                            value="paypal" 
                            id="paypal" 
                            disabled={isPaypalDisabled} 
                          />
                        </FormControl>
                        <FormLabel 
                          className={`flex items-center gap-2 cursor-pointer font-normal ${isPaypalDisabled ? 'opacity-50' : ''}`} 
                          htmlFor="paypal"
                        >
                          <DollarSign className="h-4 w-4" />
                          <span>PayPal</span>
                          {isPaypalDisabled && (
                            <span className="text-xs text-red-500 ml-1">
                              (Available for donations ₹{MIN_PAYPAL_AMOUNT} and above)
                            </span>
                          )}
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            
            <Button 
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Pay Now"}
            </Button>
          </form>
        </Form>
        
        <p className="text-xs text-center text-muted-foreground">
          You will be redirected to Cashfree's secure payment gateway
        </p>
      </Card>
    </div>
  );
};

export default PaymentCheckout;
