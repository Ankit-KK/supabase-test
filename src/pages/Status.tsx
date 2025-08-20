import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Status() {
  const [searchParams] = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'failure' | 'pending'>('loading');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  
  const orderId = searchParams.get('order_id');
  const status = searchParams.get('status');

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!orderId) {
        setPaymentStatus('failure');
        return;
      }

      try {
        // Call edge function to check payment status
        const { data, error } = await supabase.functions.invoke('check-payment-status', {
          body: { order_id: orderId }
        });

        if (error) {
          console.error('Error checking payment status:', error);
          setPaymentStatus('failure');
          return;
        }

        setPaymentDetails(data);
        
        // Prefer backend's final_status when available
        if (data?.final_status) {
          const fs = String(data.final_status).toLowerCase();
          if (fs === 'success') {
            setPaymentStatus('success');
          } else if (fs === 'pending') {
            setPaymentStatus('pending');
          } else if (fs === 'cancelled' || fs === 'failed' || fs === 'failure') {
            setPaymentStatus('failure');
          } else {
            setPaymentStatus('pending');
          }
        } else if (data.payments && data.payments.length > 0) {
          const successfulPayment = data.payments.find((p: any) => p.payment_status === "SUCCESS");
          const pendingPayment = data.payments.find((p: any) => p.payment_status === "PENDING");
          
          if (successfulPayment) {
            setPaymentStatus('success');
          } else if (pendingPayment) {
            setPaymentStatus('pending');
          } else {
            setPaymentStatus('failure');
          }
        } else {
          // Fallback to URL status parameter if no payments data
          if (status === 'success') setPaymentStatus('success');
          else if (status === 'pending') setPaymentStatus('pending');
          else setPaymentStatus('failure');
        }
      } catch (err) {
        console.error('Payment status check failed:', err);
        setPaymentStatus('failure');
      }
    };

    checkPaymentStatus();
  }, [orderId, status]);

  const getStatusContent = () => {
    switch (paymentStatus) {
      case 'success':
        return {
          icon: <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />,
          title: "Payment Successful!",
          description: "Your donation has been processed successfully. Thank you for your support!",
          color: "text-green-600"
        };
      case 'pending':
        return {
          icon: <Clock className="h-16 w-16 text-yellow-500 mx-auto" />,
          title: "Payment Pending",
          description: "Your payment is being processed. Please wait for confirmation.",
          color: "text-yellow-600"
        };
      case 'failure':
        return {
          icon: <XCircle className="h-16 w-16 text-red-500 mx-auto" />,
          title: "Payment Failed",
          description: "Your payment could not be processed. Please try again.",
          color: "text-red-600"
        };
      default:
        return {
          icon: <Clock className="h-16 w-16 text-blue-500 mx-auto animate-spin" />,
          title: "Checking Payment Status...",
          description: "Please wait while we verify your payment.",
          color: "text-blue-600"
        };
    }
  };

  const statusContent = getStatusContent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {statusContent.icon}
          <CardTitle className={`text-2xl ${statusContent.color}`}>
            {statusContent.title}
          </CardTitle>
          <CardDescription className="text-lg">
            {statusContent.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {orderId && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Order ID: <span className="font-mono">{orderId}</span>
              </p>
            </div>
          )}
          
          {paymentDetails && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Amount: ₹{paymentDetails.order_amount}</p>
              {paymentDetails.customer_details?.customer_name && (
                <p>Name: {paymentDetails.customer_details.customer_name}</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link to="/chia_gaming">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Donation Page
              </Link>
            </Button>
            
            {paymentStatus === 'pending' && (
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Refresh Status
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}