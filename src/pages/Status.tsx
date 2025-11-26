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
        // Determine which function to call based on order ID prefix (supports both old and new formats)
        const getCheckPaymentFunction = (orderId: string) => {
          if (orderId.startsWith('ankit_') || orderId.startsWith('ak_rp_')) return 'check-payment-status-ankit';
          if (orderId.startsWith('thunderx_') || orderId.startsWith('tx_rp_')) return 'check-payment-status-thunderx';
          if (orderId.startsWith('vb_rp_')) return 'check-payment-status-vipbhai';
          if (orderId.startsWith('sug_rp_')) return 'check-payment-status-sagarujjwalgaming';
          if (orderId.startsWith('nyk_rp_')) return 'check-payment-status-notyourkween';
          if (orderId.startsWith('musicstream_')) return 'check-payment-status';
          if (orderId.startsWith('techgamer_')) return 'check-payment-status';
          if (orderId.startsWith('fitnessflow_')) return 'check-payment-status';
          if (orderId.startsWith('artcreate_')) return 'check-payment-status';
          if (orderId.startsWith('looteriya_gaming_')) return 'check-payment-status';
          if (orderId.startsWith('demostreamer_')) return 'check-payment-status';
          if (orderId.startsWith('damask_plays_')) return 'check-payment-status';
          if (orderId.startsWith('neko_xenpai_')) return 'check-payment-status';
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

        // ALWAYS trust backend status over URL parameter
        setPaymentStatus(backendStatus as any);

        // If payment is successful, upload voice message if it exists
        // Skip voice upload for Razorpay streamers (ThunderX, Ankit) - they upload BEFORE payment
        if (backendStatus === 'success') {
          const shouldSkipVoiceUpload = (orderId: string) => {
            // Razorpay streamers upload voice messages before payment via upload-voice-message-direct
            if (orderId.startsWith('ak_rp_') || orderId.startsWith('tx_rp_') || orderId.startsWith('vb_rp_') || orderId.startsWith('sug_rp_') || orderId.startsWith('nyk_rp_')) return true;
            if (orderId.startsWith('ankit_razorpay_') || orderId.startsWith('thunderx_razorpay_')) return true;
            return false;
          };

          if (!shouldSkipVoiceUpload(orderId)) {
            try {
              console.log('Payment successful, checking for voice message upload...');
              const getVoiceUploadFunction = (orderId: string) => {
                if (orderId.startsWith('musicstream_')) return 'upload-voice-message-musicstream';
                if (orderId.startsWith('techgamer_')) return 'upload-voice-message-techgamer';
                if (orderId.startsWith('sizzors_')) return 'upload-voice-message-sizzors';
                if (orderId.startsWith('artcreate_')) return 'upload-voice-message-artcreate';
                if (orderId.startsWith('looteriya_gaming_')) return 'upload-voice-message-looteriya-gaming';
                if (orderId.startsWith('demostreamer_')) return 'upload-voice-message-demostreamer';
                return 'upload-voice-message'; // default for chia_gaming
              };
              
              const voiceFunctionName = getVoiceUploadFunction(orderId);
              console.log(`Voice upload function determined: ${voiceFunctionName} for order: ${orderId}`);
              
              // Add a small delay to ensure webhook has completed
              await new Promise(resolve => setTimeout(resolve, 2000));
              
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
          } else {
            console.log('Skipping voice upload for Razorpay streamer (already uploaded before payment)');
          }
        }
      } catch (err) {
        console.error('Payment status check failed:', err);
        setPaymentStatus('failure');
      }
    };

    checkPaymentStatus();
  }, [orderId, status]);

  // Auto-refresh for pending payments
  useEffect(() => {
    if (paymentStatus === 'pending') {
      const timer = setTimeout(() => {
        window.location.reload();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [paymentStatus]);

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

  const statusContent = getStatusContent(paymentStatus);

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
                if (orderId.startsWith('ankit_') || orderId.startsWith('ak_rp_')) return "/ankit";
                if (orderId.startsWith('thunderx_') || orderId.startsWith('tx_rp_')) return "/thunderx";
                if (orderId.startsWith('vb_rp_')) return "/vipbhai";
                if (orderId.startsWith('sug_rp_')) return "/sagarujjwalgaming";
                if (orderId.startsWith('nyk_rp_')) return "/notyourkween";
                if (orderId.startsWith('musicstream_')) return "/music_stream";
                if (orderId.startsWith('techgamer_')) return "/tech_gamer";
                if (orderId.startsWith('sizzors_')) return "/sizzors";
                if (orderId.startsWith('artcreate_')) return "/art_create";
                if (orderId.startsWith('looteriya_gaming_')) return "/looteriya_gaming";
                if (orderId.startsWith('demostreamer_')) return "/demo_streamer";
                if (orderId.startsWith('damask_plays_')) return "/damask_plays";
                if (orderId.startsWith('neko_xenpai_')) return "/neko_xenpai";
                return "/chiaa_gaming"; // default for chia_gaming
              })()}>
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