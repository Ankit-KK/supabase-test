
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Check } from "lucide-react";

const SuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    // Parse URL query parameters
    const params = new URLSearchParams(location.search);
    const orderId = params.get('order_id');
    
    if (!orderId) {
      // No order ID in URL, check if we have stored data
      const storedData = sessionStorage.getItem('donation_data');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (parsedData.orderId) {
          checkPaymentStatus(parsedData.orderId);
          return;
        }
      }
      
      setLoading(false);
      setPaymentStatus('unknown');
      return;
    }

    checkPaymentStatus(orderId);
  }, [location]);

  const checkPaymentStatus = async (orderId: string) => {
    try {
      // Call our edge function to verify payment status
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { orderId }
      });

      if (error) {
        console.error("Error verifying payment:", error);
        setPaymentStatus('error');
        setLoading(false);
        return;
      }

      console.log("Payment verification response:", data);
      
      // Store the payment details for display
      setPaymentDetails(data);
      
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
      
      setPaymentStatus(orderStatus);
      
      // Update the payment status in our database for all statuses
      let dbStatus = 'pending';
      
      if (orderStatus === "success") {
        dbStatus = 'completed';
      } else if (orderStatus === "failed") {
        dbStatus = 'failed';
      }
      
      // Update the database with the current status
      await supabase
        .from("donations")
        .update({ payment_status: dbStatus })
        .eq('order_id', orderId);
      
      setLoading(false);
    } catch (err) {
      console.error("Error checking payment status:", err);
      setPaymentStatus('error');
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying your payment...</p>
        </div>
      );
    }

    switch (paymentStatus) {
      case 'success':
        return (
          <>
            <div className="flex flex-col items-center my-6">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-600">Payment Successful!</h3>
              <p className="text-muted-foreground mt-2">Thank you for supporting your favorite streamer</p>
            </div>
            
            {paymentDetails && (
              <div className="border rounded-md p-4 mt-4">
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-muted-foreground">Amount</div>
                  <div className="font-medium">₹{paymentDetails.order_amount}</div>
                  
                  <div className="text-muted-foreground">Order ID</div>
                  <div className="font-medium text-xs">{paymentDetails.order_id}</div>
                  
                  <div className="text-muted-foreground">Transaction Time</div>
                  <div className="font-medium">{new Date(paymentDetails.created_at).toLocaleString()}</div>
                </div>
              </div>
            )}
          </>
        );
      
      case 'pending':
        return (
          <div className="text-center py-6">
            <h3 className="text-xl font-semibold text-amber-600">Payment Pending</h3>
            <p className="text-muted-foreground mt-2">Your payment is being processed. Please check back later.</p>
          </div>
        );
      
      case 'failed':
        return (
          <div className="text-center py-6">
            <h3 className="text-xl font-semibold text-red-600">Payment Failed</h3>
            <p className="text-muted-foreground mt-2">There was an issue with your payment. Please try again.</p>
          </div>
        );
      
      default:
        return (
          <div className="text-center py-6">
            <h3 className="text-xl font-semibold">Payment Information Unavailable</h3>
            <p className="text-muted-foreground mt-2">We couldn't find any payment information. Please return to the donation page.</p>
          </div>
        );
    }
  };

  return (
    <div className="container max-w-md py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Payment Status</CardTitle>
          <CardDescription>Your donation to support the streamer</CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            onClick={() => navigate('/')}
            className="bg-hero-gradient hover:opacity-90 transition-opacity"
          >
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SuccessPage;
