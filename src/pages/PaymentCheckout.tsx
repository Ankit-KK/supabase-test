
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    Cashfree: any;
    cashfree: any;
  }
}

const PaymentCheckout: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [donationData, setDonationData] = useState<any>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    // Load the Cashfree SDK
    const loadCashfreeScript = () => {
      const script = document.createElement("script");
      script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
      script.async = true;
      script.onload = () => {
        window.cashfree = window.Cashfree({
          mode: "production"
        });
      };
      document.body.appendChild(script);
    };

    // Get donation data from session storage
    const storedData = sessionStorage.getItem('donation_data');
    if (!storedData) {
      navigate('/ankit');
      return;
    }

    const parsedData = JSON.parse(storedData);
    setDonationData(parsedData);
    
    // Create order on component mount
    const createOrder = async () => {
      try {
        setLoading(true);
        
        // Call our edge function to create the order
        const { data, error } = await supabase.functions.invoke('create-payment-order', {
          body: {
            orderId: parsedData.orderId,
            amount: parsedData.amount,
            name: parsedData.name
          }
        });
        
        if (error) {
          console.error("Error creating payment order:", error);
          throw new Error("Failed to create payment order");
        }
        
        setPaymentSessionId(data.payment_session_id);
        setLoading(false);
      } catch (err) {
        console.error("Error in payment processing:", err);
        setLoading(false);
      }
    };
    
    loadCashfreeScript();
    createOrder();
  }, [navigate]);

  const handlePaymentClick = () => {
    if (!paymentSessionId || !window.cashfree) {
      return;
    }
    
    setProcessingPayment(true);
    
    const checkoutOptions = {
      paymentSessionId: paymentSessionId,
      returnUrl: `${window.location.origin}/success`,
    };
    
    window.cashfree.checkout(checkoutOptions).then((result: any) => {
      setProcessingPayment(false);
      
      if (result.error) {
        console.log("There is some payment error:", result.error);
      }
      
      if (result.redirect) {
        console.log("Payment will be redirected");
      }
      
      if (result.paymentDetails) {
        console.log("Payment completed:", result.paymentDetails);
      }
    });
  };

  if (loading) {
    return (
      <div className="container max-w-lg py-12 px-4 text-center">
        <Card>
          <CardHeader>
            <CardTitle>Preparing Your Payment</CardTitle>
            <CardDescription>Please wait, we're setting up your payment...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-lg py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Complete Your Payment</CardTitle>
          <CardDescription>Support your favorite streamer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {donationData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="font-medium">{donationData.name}</div>
                
                <div className="text-sm text-muted-foreground">Amount</div>
                <div className="font-medium">₹{donationData.amount}</div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground mb-1">Your Message</div>
                <div className="p-3 bg-muted rounded-md text-sm">{donationData.message}</div>
              </div>
              
              <Button 
                onClick={handlePaymentClick}
                disabled={!paymentSessionId || processingPayment}
                className="w-full bg-hero-gradient hover:opacity-90 transition-opacity"
              >
                {processingPayment ? (
                  <>
                    <span className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Processing...
                  </>
                ) : "Pay Now"}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground pt-4">
                <p>You'll be redirected to Cashfree's secure payment page</p>
              </div>
            </div>
          )}
          
          {!donationData && (
            <div className="text-center py-4">
              <p>No payment information found. Please try again.</p>
              <Button 
                onClick={() => navigate('/ankit')}
                variant="outline" 
                className="mt-4"
              >
                Return to donation form
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCheckout;
