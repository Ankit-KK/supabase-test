// Payment status page - supports active streamers: Ankit, Chiaa Gaming, Looteriya Gaming
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, ArrowLeft, RefreshCw, Gift, ExternalLink } from "lucide-react";
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

// Minimum display time for animation (ms)
const MINIMUM_DISPLAY_TIME = 2500;

// Progress steps shown during verification
const VERIFICATION_STEPS = [
  "Connecting to payment gateway...",
  "Verifying transaction...",
  "Confirming payment status...",
  "Almost done..."
];

export default function Status() {
  const [searchParams] = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'failure' | 'pending'>('loading');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const orderId = searchParams.get('order_id');
  const status = searchParams.get('status');
  const statusToken = searchParams.get('st');

  // Cycle through progress steps while loading
  useEffect(() => {
    if (!showResult && paymentStatus === 'loading') {
      const interval = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % VERIFICATION_STEPS.length);
      }, 800);
      
      return () => clearInterval(interval);
    }
  }, [showResult, paymentStatus]);

  useEffect(() => {
    const startTime = Date.now();
    
    const checkPaymentStatus = async () => {
      // Check for missing or invalid order_id (including string "undefined")
      if (!orderId || orderId === 'undefined' || orderId === 'null') {
        console.error('[Status] Invalid order_id:', orderId);
        // Still wait minimum time before showing error
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, MINIMUM_DISPLAY_TIME - elapsed);
        setTimeout(() => {
          setPaymentStatus('failure');
          setPaymentDetails({ error: 'Invalid or missing order ID. Please try again.' });
          setShowResult(true);
        }, remaining);
        return;
      }

      try {
        // Determine which function to call based on order ID prefix
        // All active streamers use the unified function
        const getCheckPaymentFunction = (orderId: string) => {
          console.log('[Status] Checking payment for order_id:', orderId);
          
          // Active streamers - all use unified function
          if (orderId.startsWith('ank_rp_')) return 'check-payment-status-unified';
          if (orderId.startsWith('lg_rp_')) return 'check-payment-status-unified';
          if (orderId.startsWith('cg_rp_')) return 'check-payment-status-unified';
          if (orderId.startsWith('cg2_rp_')) return 'check-payment-status-unified'; // Clumsy God
          if (orderId.startsWith('wf_rp_')) return 'check-payment-status-unified'; // Wolfy
          if (orderId.startsWith('dp2_rp_')) return 'check-payment-status-unified'; // DorpPlays
          if (orderId.startsWith('zs_rp_')) return 'check-payment-status-unified'; // Zishu
          if (orderId.startsWith('bz_rp_')) return 'check-payment-status-unified'; // Brigzard
          if (orderId.startsWith('we_rp_')) return 'check-payment-status-unified'; // W Era
          if (orderId.startsWith('mc_rp_')) return 'check-payment-status-unified'; // Mr Champion
          if (orderId.startsWith('dg_rp_')) return 'check-payment-status-unified'; // Demigod
          if (orderId.startsWith('np_rp_')) return 'check-payment-status-unified'; //novaplays
          if (orderId.startsWith('sa_rp_')) return 'check-payment-status-unified';// starlight
          if (orderId.startsWith('ry_rp_')) return 'check-payment-status-unified';//reyna_yadav
          if (orderId.startsWith('slp_rp_')) return 'check-payment-status-unified';//slidey_playz
          if (orderId.startsWith('ex_rp_')) return 'check-payment-status-unified';//eryx_live
          if (orderId.startsWith('chiagaming_rp_')) return 'check-payment-status-unified';
          
          
          // Legacy Ankit prefix
          if (orderId.startsWith('ak_rp_')) return 'check-payment-status-unified';
          
          // Streamer-specific functions for legacy support (Ankit, Chiaa, Looteriya)
          if (orderId.startsWith('ankit_')) return 'check-payment-status-ankit';
          
          console.warn('[Status] Unknown order_id prefix, defaulting to unified:', orderId);
          return 'check-payment-status-unified';
        };
        
        const functionName = getCheckPaymentFunction(orderId);
        console.log('[Status] Using function:', functionName, 'for order_id:', orderId);
        
        // Call the appropriate edge function to check payment status
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: { order_id: orderId, status_token: statusToken }
        });

        if (error) {
          console.error('Error checking payment status:', error);
          // Wait minimum time before showing error
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, MINIMUM_DISPLAY_TIME - elapsed);
          setTimeout(() => {
            setPaymentStatus('failure');
            setPaymentDetails({ error: 'Unable to verify payment status. Please refresh or contact support.' });
            setShowResult(true);
          }, remaining);
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

        // Calculate remaining time to meet minimum display
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, MINIMUM_DISPLAY_TIME - elapsed);
        
        // Wait for minimum time before showing result
        setTimeout(() => {
          setPaymentStatus(backendStatus as any);
          setShowResult(true);
        }, remaining);

        // Voice upload is handled before payment for all Razorpay streamers
        // No post-payment upload needed
      } catch (err) {
        console.error('Payment status check failed:', err);
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, MINIMUM_DISPLAY_TIME - elapsed);
        setTimeout(() => {
          setPaymentStatus('failure');
          setShowResult(true);
        }, remaining);
      }
    };

    checkPaymentStatus();
  }, [orderId, status]);

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
    
    // Active streamers
    if (orderId.startsWith('ank_rp_') || orderId.startsWith('ak_rp_') || orderId.startsWith('ankit_')) return "/ankit";
    if (orderId.startsWith('lg_rp_')) return "/looteriya_gaming";
    if (orderId.startsWith('cg_rp_') || orderId.startsWith('chiagaming_rp_')) return "/chiaa_gaming";
    if (orderId.startsWith('cg2_rp_')) return "/clumsy_god";
    if (orderId.startsWith('wf_rp_')) return "/wolfy";
    if (orderId.startsWith('dp2_rp_')) return "/dorp_plays";
    if (orderId.startsWith('zs_rp_')) return "/zishu";
    if (orderId.startsWith('bz_rp_')) return "/brigzard";
    if (orderId.startsWith('we_rp_')) return "/w_era";
    if (orderId.startsWith('mc_rp_')) return "/mr_champion";
    if (orderId.startsWith('dg_rp_')) return "/demigod";
    if (orderId.startsWith('np_rp_')) return "/nova_plays";
    if (orderId.startsWith('sa_rp_')) return "/starlight_anya";
    if (orderId.startsWith('ry_rp_')) return "/reyna_yadav";
    if (orderId.startsWith('slp_rp_')) return "/slidey_playz";
    if (orderId.startsWith('ex_rp_')) return "/eryx";
    
    console.warn('[Status] Unknown order_id prefix for navigation, redirecting to homepage:', orderId);
    return "/";
  };

  const statusContent = getStatusContent(paymentStatus);
  const showTetris = !showResult || paymentStatus === 'pending';

  return (
    <div className="status-screen-container">
      <div className={`status-screen status-${paymentStatus}`}>
        {/* Logo */}
        <div className="status-logo">
          <img src={hyperchatLogo} alt="HyperChat" />
        </div>

        {/* Tetris Loader - visible during loading/pending */}
        {showTetris && (
          <>
            <div className="tetris-loader">
              <div className="tetris-grid-overlay" />
              <div className="tetris-container">
                <TetrisBlockI />
                <TetrisBlockO />
                <TetrisBlockZ />
                <TetrisBlockL />
              </div>
            </div>
            {!showResult && (
              <p className="verification-step">{VERIFICATION_STEPS[currentStep]}</p>
            )}
          </>
        )}

        {/* Status Icon for success/failure - only show after result is ready */}
        {showResult && paymentStatus === 'success' && (
          <CheckCircle className="status-icon-success" />
        )}
        {showResult && paymentStatus === 'failure' && (
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

        {/* Hyperpoints CTA - only on success */}
        {showResult && paymentStatus === 'success' && (
          <a
            href="https://hyperchat.store/"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full my-4 p-4 rounded-xl border border-yellow-500/40 bg-yellow-500/10 backdrop-blur-sm shadow-[0_0_20px_rgba(234,179,8,0.15)] hover:shadow-[0_0_30px_rgba(234,179,8,0.25)] hover:border-yellow-400/60 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Gift className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-yellow-300">Check your Hyperpoints here ✨</p>
                <p className="text-xs text-yellow-400/60 mt-0.5">View & redeem your reward points</p>
              </div>
              <ExternalLink className="h-4 w-4 text-yellow-400/50 group-hover:text-yellow-300 transition-colors" />
            </div>
          </a>
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
