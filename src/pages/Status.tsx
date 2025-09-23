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
        // Determine which function to call based on order ID prefix
        const getCheckPaymentFunction = (orderId: string) => {
          if (orderId.startsWith('ankit_')) return 'check-payment-status-ankit';
          if (orderId.startsWith('musicstream_')) return 'check-payment-status';
          if (orderId.startsWith('techgamer_')) return 'check-payment-status';
          if (orderId.startsWith('fitnessflow_')) return 'check-payment-status';
          if (orderId.startsWith('artcreate_')) return 'check-payment-status';
          if (orderId.startsWith('codelive_')) return 'check-payment-status';
          if (orderId.startsWith('demostreamer_')) return 'check-payment-status';
          return 'check-payment-status'; // default for chia_gaming
        };
        
        const functionName = getCheckPaymentFunction(orderId);
        
        // Call the appropriate edge function to check payment status
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: { order_id: orderId }
        });

        if (error) {
          console.error('Error checking payment status:', error);
          setPaymentStatus('failure');
          return;
        }

        setPaymentDetails(data);
        
        // Compute backend status, then safely merge with URL hint
        let backendStatus: 'success' | 'pending' | 'failure' = 'pending';
        if (data?.final_status) {
          const fs = String(data.final_status).toLowerCase();
          if (fs === 'success') backendStatus = 'success';
          else if (fs === 'pending') backendStatus = 'pending';
          else if (fs === 'cancelled' || fs === 'failed' || fs === 'failure' || fs === 'expired' || fs === 'void') backendStatus = 'failure';
          else backendStatus = 'pending';
        } else if (data?.order_status) {
          const os = String(data.order_status).toLowerCase();
          if (['paid', 'success', 'captured', 'authorized'].includes(os)) backendStatus = 'success';
          else if (['active', 'pending', 'in_progress', 'requires_action'].includes(os)) backendStatus = 'pending';
          else if (['cancelled', 'failed', 'failure', 'expired', 'void'].includes(os)) backendStatus = 'failure';
          else backendStatus = 'pending';
        } else if (data?.payments && data.payments.length > 0) {
          const successfulPayment = data.payments.find((p: any) => ['SUCCESS', 'CAPTURED'].includes(String(p.payment_status)));
          const pendingPayment = data.payments.find((p: any) => ['PENDING', 'AUTHORIZED'].includes(String(p.payment_status)));
          const failedPayment = data.payments.find((p: any) => ['FAILED', 'CANCELLED', 'NOT_ATTEMPTED', 'USER_DROPPED', 'REFUNDED'].includes(String(p.payment_status)));
          if (successfulPayment) backendStatus = 'success';
          else if (pendingPayment) backendStatus = 'pending';
          else if (failedPayment) backendStatus = 'failure';
          else backendStatus = 'pending';
        } else {
          // Fallback to URL status parameter if no payments data
          const url = (status || '').toLowerCase();
          if (url === 'success') backendStatus = 'success';
          else if (url === 'pending') backendStatus = 'pending';
          else if (url === 'failure' || url === 'failed' || url === 'cancelled') backendStatus = 'failure';
          else backendStatus = 'pending';
        }

        // Merge rule: never downgrade success; if URL says failure, prefer it over pending
        const urlStatus = (status || '').toLowerCase();
        let finalStatus: 'success' | 'pending' | 'failure' = backendStatus;
        if (urlStatus === 'success') {
          finalStatus = 'success';
        } else if (urlStatus === 'failure' || urlStatus === 'failed' || urlStatus === 'cancelled') {
          if (backendStatus !== 'success') finalStatus = 'failure';
        }

        setPaymentStatus(finalStatus as any);

        // If payment is successful, upload voice message if it exists
        if (finalStatus === 'success') {
          try {
            console.log('Payment successful, checking for voice message upload...');
            const getVoiceUploadFunction = (orderId: string) => {
              if (orderId.startsWith('ankit_')) return 'upload-voice-message-ankit';
              if (orderId.startsWith('musicstream_')) return 'upload-voice-message-musicstream';
              if (orderId.startsWith('techgamer_')) return 'upload-voice-message-techgamer';
              if (orderId.startsWith('fitnessflow_')) return 'upload-voice-message-fitnessflow';
              if (orderId.startsWith('artcreate_')) return 'upload-voice-message-artcreate';
              if (orderId.startsWith('codelive_')) return 'upload-voice-message-codelive';
              if (orderId.startsWith('demostreamer_')) return 'upload-voice-message-demostreamer';
              return 'upload-voice-message'; // default for chia_gaming
            };
            
            const voiceFunctionName = getVoiceUploadFunction(orderId);
            const { data: uploadResult, error: uploadError } = await supabase.functions.invoke(voiceFunctionName, {
              body: { order_id: orderId }
            });
            
            if (uploadError) {
              console.error('Voice message upload error:', uploadError);
            } else if (uploadResult?.success) {
              console.log('Voice message uploaded successfully:', uploadResult.voice_message_url);
            }
          } catch (uploadErr) {
            console.error('Failed to upload voice message:', uploadErr);
            // Don't fail the entire status check if voice upload fails
          }
        }
      } catch (err) {
        console.error('Payment status check failed:', err);
        setPaymentStatus('failure');
      }
    };

    checkPaymentStatus();
  }, [orderId, status]);

  // Derive effective status: if URL indicates failure/cancelled, show failure unless backend says success
  const urlStatusLower = (status || '').toLowerCase();
  const failureFromUrl = urlStatusLower === 'failure' || urlStatusLower === 'failed' || urlStatusLower === 'cancelled';
  const effectiveStatus = failureFromUrl ? (paymentStatus === 'success' ? 'success' : 'failure') : paymentStatus;

  const getStatusContent = (st: typeof paymentStatus) => {
    switch (st) {
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

  const statusContent = getStatusContent(effectiveStatus);

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
              <Link to={(() => {
                if (!orderId) return "/";
                if (orderId.startsWith('ankit_')) return "/ankit";
                if (orderId.startsWith('musicstream_')) return "/music_stream";
                if (orderId.startsWith('techgamer_')) return "/tech_gamer";
                if (orderId.startsWith('fitnessflow_')) return "/fitness_flow";
                if (orderId.startsWith('artcreate_')) return "/art_create";
                if (orderId.startsWith('codelive_')) return "/code_live";
                if (orderId.startsWith('demostreamer_')) return "/demo_streamer";
                return "/chiaa_gaming"; // default for chia_gaming
              })()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Donation Page
              </Link>
            </Button>
            
            {effectiveStatus === 'pending' && (
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