// Payment status page - supports all streamers with Razorpay and Cashfree integrations
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import hyperchatLogo from "@/assets/hyperchat-logo-short.png";

// Tetris Block Components
const TetrisBlockI = () => (
  <div className="tetris-block tetris-block-I">
    <div className="tetris-square" />
    <div className="tetris-square" />
    <div className="tetris-square" />
    <div className="tetris-square" />
  </div>
);

const TetrisBlockO = () => (
  <div className="tetris-block tetris-block-O">
    <div className="tetris-square" /><div className="tetris-square" />
    <div className="tetris-square" /><div className="tetris-square" />
  </div>
);

const TetrisBlockZ = () => (
  <div className="tetris-block tetris-block-Z">
    <div className="tetris-square" /><div className="tetris-square" /><div className="tetris-square" />
    <div className="tetris-square" /><div className="tetris-square" /><div className="tetris-square" />
  </div>
);

const TetrisBlockL = () => (
  <div className="tetris-block tetris-block-L">
    <div className="tetris-square" /><div className="tetris-square" />
    <div className="tetris-square" /><div className="tetris-square" />
    <div className="tetris-square" /><div className="tetris-square" />
  </div>
);

export default function Status() {
  const [searchParams] = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'failure' | 'pending'>('loading');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  
  const orderId = searchParams.get('order_id');
  const status = searchParams.get('status');

  useEffect(() => {
    const checkPaymentStatus = async () => {
      // Check for missing or invalid order_id (including string "undefined")
      if (!orderId || orderId === 'undefined' || orderId === 'null') {
        console.error('[Status] Invalid order_id:', orderId);
        setPaymentStatus('failure');
        setPaymentDetails({ error: 'Invalid or missing order ID. Please try again.' });
        return;
      }

      try {
        // Determine which function to call based on order ID prefix (supports both old and new formats)
        const getCheckPaymentFunction = (orderId: string) => {
          console.log('[Status] Checking payment for order_id:', orderId);
          
          if (orderId.startsWith('ankit_') || orderId.startsWith('ak_rp_')) return 'check-payment-status-ankit';
          if (orderId.startsWith('thunderx_') || orderId.startsWith('tx_rp_')) return 'check-payment-status-thunderx';
          if (orderId.startsWith('vb_rp_')) return 'check-payment-status-vipbhai';
          if (orderId.startsWith('sug_rp_')) return 'check-payment-status-sagarujjwalgaming';
          if (orderId.startsWith('nyk_rp_')) return 'check-payment-status-notyourkween';
          if (orderId.startsWith('bf_rp_')) return 'check-payment-status-bongflick';
          if (orderId.startsWith('miq_rp_')) return 'check-payment-status-mriqmaster';
          if (orderId.startsWith('abd_rp_')) return 'check-payment-status-abdevil';
          if (orderId.startsWith('jv_rp_')) return 'check-payment-status-jhanvoo';
          if (orderId.startsWith('lg_rp_')) return 'check-payment-status-looteriya-gaming';
          if (orderId.startsWith('dp_rp_')) return 'check-payment-status-damask-plays';
          if (orderId.startsWith('nx_rp_')) return 'check-payment-status-neko-xenpai';
          if (orderId.startsWith('cg_rp_')) return 'check-payment-status-clumsygod';
          if (orderId.startsWith('jg_rp_')) return 'check-payment-status-jimmygaming';
          if (orderId.startsWith('chiagaming_rp_')) return 'check-payment-status-chiagaming';
          
          console.warn('[Status] Unknown order_id prefix, defaulting to check-payment-status:', orderId);
          return 'check-payment-status'; // default fallback
        };
        
        const functionName = getCheckPaymentFunction(orderId);
        console.log('[Status] Using function:', functionName, 'for order_id:', orderId);
        
        // Call the appropriate edge function to check payment status
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: { order_id: orderId }
        });

        if (error) {
          console.error('Error checking payment status:', error);
          // Don't fall back to URL status - show failure with clear message
          setPaymentStatus('failure');
          setPaymentDetails({ error: 'Unable to verify payment status. Please refresh or contact support.' });
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
            if (orderId.startsWith('ak_rp_') || orderId.startsWith('tx_rp_') || orderId.startsWith('vb_rp_') || orderId.startsWith('sug_rp_') || orderId.startsWith('nyk_rp_') || orderId.startsWith('bf_rp_') || orderId.startsWith('miq_rp_') || orderId.startsWith('abd_rp_') || orderId.startsWith('jv_rp_') || orderId.startsWith('lg_rp_') || orderId.startsWith('dp_rp_') || orderId.startsWith('nx_rp_') || orderId.startsWith('cg_rp_') || orderId.startsWith('jg_rp_') || orderId.startsWith('chiagaming_rp_')) return true;
            if (orderId.startsWith('ankit_razorpay_') || orderId.startsWith('thunderx_razorpay_')) return true;
            return false;
          };

          if (!shouldSkipVoiceUpload(orderId)) {
            try {
              console.log('Payment successful, checking for voice message upload...');
              const getVoiceUploadFunction = () => {
                return 'upload-voice-message'; // default for chia_gaming (only Cashfree streamer)
              };
              
              const voiceFunctionName = getVoiceUploadFunction();
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
          title: "Payment Successful!",
          description: "Your donation has been processed. Thank you for your support!"
        };
      case 'pending':
        return {
          title: "Verifying Payment...",
          description: "Please wait while we confirm your payment."
        };
      case 'failure':
        return {
          title: "Payment Failed",
          description: paymentDetails?.error || "Your payment could not be processed. Please try again."
        };
      default:
        return {
          title: "Checking Payment...",
          description: "Please wait while we verify your payment."
        };
    }
  };

  const getBackLink = () => {
    if (!orderId) return "/";
    if (orderId.startsWith('ankit_') || orderId.startsWith('ak_rp_')) return "/ankit";
    if (orderId.startsWith('thunderx_') || orderId.startsWith('tx_rp_')) return "/thunderx";
    if (orderId.startsWith('vb_rp_')) return "/vipbhai";
    if (orderId.startsWith('sug_rp_')) return "/sagarujjwalgaming";
    if (orderId.startsWith('nyk_rp_')) return "/notyourkween";
    if (orderId.startsWith('bf_rp_')) return "/bongflick";
    if (orderId.startsWith('miq_rp_')) return "/mriqmaster";
    if (orderId.startsWith('abd_rp_')) return "/abdevil";
    if (orderId.startsWith('jv_rp_')) return "/jhanvoo";
    if (orderId.startsWith('lg_rp_')) return "/looteriya_gaming";
    if (orderId.startsWith('dp_rp_')) return "/damask_plays";
    if (orderId.startsWith('nx_rp_')) return "/neko_xenpai";
    if (orderId.startsWith('cg_rp_')) return "/clumsygod";
    if (orderId.startsWith('jg_rp_')) return "/jimmy_gaming";
    if (orderId.startsWith('chiagaming_rp_')) return "/chiaa_gaming";
    if (orderId.startsWith('sizzors_')) return "/sizzors";
    
    console.warn('[Status] Unknown order_id prefix for navigation, redirecting to homepage:', orderId);
    return "/";
  };

  const statusContent = getStatusContent(paymentStatus);
  const showTetris = paymentStatus === 'loading' || paymentStatus === 'pending';

  return (
    <div className="status-screen-container">
      <div className={`status-screen status-${paymentStatus}`}>
        {/* Logo */}
        <div className="status-logo">
          <img src={hyperchatLogo} alt="HyperChat" />
        </div>

        {/* Tetris Loader - visible during loading/pending */}
        {showTetris && (
          <div className="tetris-loader">
            <div className="tetris-grid-overlay" />
            <div className="tetris-container">
              <TetrisBlockI />
              <TetrisBlockO />
              <TetrisBlockZ />
              <TetrisBlockL />
            </div>
          </div>
        )}

        {/* Status Icon for success/failure */}
        {paymentStatus === 'success' && (
          <CheckCircle className="status-icon-success" />
        )}
        {paymentStatus === 'failure' && (
          <XCircle className="status-icon-failure" />
        )}

        {/* Status Text */}
        <h2 className="status-title">{statusContent.title}</h2>
        <p className="status-description">{statusContent.description}</p>

        {/* Order Details */}
        {orderId && (
          <p className="status-order-id">Order: {orderId}</p>
        )}
        
        {paymentDetails?.order_amount && (
          <p className="status-amount">Amount: ₹{paymentDetails.order_amount}</p>
        )}
        
        {paymentDetails?.customer_name && (
          <p className="status-amount">Name: {paymentDetails.customer_name}</p>
        )}

        {/* Action Buttons */}
        <div className="status-actions">
          <Button asChild className="w-full">
            <Link to={getBackLink()}>
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
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
