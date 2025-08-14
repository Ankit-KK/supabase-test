import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInputValidation } from "@/hooks/useInputValidation";
import { toast } from "@/hooks/use-toast";
import { Gamepad2, Heart, Sparkles } from "lucide-react";
import { load } from '@cashfreepayments/cashfree-js';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const ChiaGaming = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    message: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [cashfree, setCashfree] = useState<any>(null);
  const [sdkLoading, setSdkLoading] = useState(true);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const { errors, validateDonation, sanitizeInputs, clearErrors } = useInputValidation();

  // Initialize Cashfree SDK
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        setSdkLoading(true);
        setSdkError(null);
        console.log('Initializing Cashfree SDK...');
        
        const cf = await load({
          mode: "production"
        });
        
        setCashfree(cf);
        console.log('Cashfree SDK initialized successfully');
        
        toast({
          title: "Payment System Ready",
          description: "You can now make donations safely.",
        });
      } catch (error) {
        console.error('Failed to initialize Cashfree SDK:', error);
        setSdkError('Failed to load payment system. Please refresh the page.');
        toast({
          title: "Payment System Error", 
          description: "Failed to load payment system. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setSdkLoading(false);
      }
    };
    
    initializeSDK();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (errors[name as keyof typeof errors]) {
      clearErrors();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    let data: any = null;

    try {
      const amount = parseFloat(formData.amount);
      
      // Validate inputs
      if (!validateDonation(formData.name, formData.message, amount)) {
        setIsProcessing(false);
        return;
      }

      // Sanitize inputs
      const sanitized = sanitizeInputs(formData.name, formData.message);

      if (!cashfree) {
        toast({
          title: "Payment System Not Ready",
          description: "Please wait for the payment system to load or refresh the page.",
          variant: "destructive",
        });
        throw new Error('Payment system not initialized');
      }

      // Create order via Supabase edge function
      const response = await supabase.functions.invoke('create-payment-order', {
        body: {
          name: sanitized.name,
          amount: amount,
          message: sanitized.message
        }
      });

      data = response.data;
      const error = response.error;

      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to create payment order');
      }

      // Initialize Cashfree checkout
      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_modal",
      };

      const result = await cashfree.checkout(checkoutOptions);
      
      // Always redirect to status page with order ID
      const orderId = data.cf_order_id || data.order_id;
      
      if (result.error) {
        console.log("Payment cancelled or error:", result.error);
        // Redirect to status page for cancelled/failed payment
        navigate(`/status?order_id=${orderId}&status=cancelled`);
      } else if (result.paymentDetails) {
        console.log("Payment completed:", result.paymentDetails);
        // Redirect to status page for successful payment
        navigate(`/status?order_id=${orderId}&status=success`);
      } else if (result.redirect) {
        console.log("Payment will be redirected");
        // Redirect to status page for pending payment
        navigate(`/status?order_id=${orderId}&status=pending`);
      } else {
        // Fallback redirect
        navigate(`/status?order_id=${orderId}&status=unknown`);
      }

    } catch (error) {
      console.error('Payment error:', error);
      // Redirect to status page even on error, if we have an order ID
      const orderId = data?.cf_order_id || data?.order_id;
      if (orderId) {
        navigate(`/status?order_id=${orderId}&status=error`);
      } else {
        toast({
          title: "Payment Failed",
          description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gaming-pink-light via-background to-gaming-pink-light/30 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gaming-pink-primary/10 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gaming-pink-secondary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gaming-pink-accent/10 rounded-full blur-2xl animate-pulse-glow"></div>
      </div>

      <Card className="w-full max-w-md mx-auto bg-card/95 backdrop-blur-sm border-gaming-pink-primary/20 shadow-2xl relative overflow-hidden">
        {/* Card glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-gaming-pink-primary/20 via-gaming-pink-secondary/20 to-gaming-pink-accent/20 opacity-50 blur-xl"></div>
        
        <CardHeader className="text-center relative z-10">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-2 text-gaming-pink-primary">
              <Gamepad2 className="h-8 w-8" />
              <Sparkles className="h-6 w-6 animate-pulse-glow" />
              <Heart className="h-6 w-6 text-gaming-pink-accent" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gaming-pink-primary to-gaming-pink-secondary bg-clip-text text-transparent">
            Chia Gaming
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Support the gaming community with your donation
          </p>
        </CardHeader>

        <CardContent className="space-y-6 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gaming-pink-primary">
                Your Name *
              </label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleInputChange}
                className={`border-gaming-pink-primary/30 focus:border-gaming-pink-primary focus:ring-gaming-pink-primary/20 ${
                  errors.name ? 'border-destructive' : ''
                }`}
                required
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Amount Field */}
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium text-gaming-pink-primary">
                Donation Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gaming-pink-primary font-medium">
                  ₹
                </span>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder="100"
                  min="1"
                  max="100000"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className={`pl-8 border-gaming-pink-primary/30 focus:border-gaming-pink-primary focus:ring-gaming-pink-primary/20 ${
                    errors.amount ? 'border-destructive' : ''
                  }`}
                  required
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount}</p>
              )}
            </div>

            {/* Message Field */}
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium text-gaming-pink-primary">
                Message (Optional)
              </label>
              <Textarea
                id="message"
                name="message"
                placeholder="Add a supportive message..."
                value={formData.message}
                onChange={handleInputChange}
                className={`min-h-20 border-gaming-pink-primary/30 focus:border-gaming-pink-primary focus:ring-gaming-pink-primary/20 resize-none ${
                  errors.message ? 'border-destructive' : ''
                }`}
                maxLength={500}
              />
              {errors.message && (
                <p className="text-sm text-destructive">{errors.message}</p>
              )}
              <p className="text-xs text-muted-foreground text-right">
                {formData.message.length}/500
              </p>
            </div>

            {/* Pay Button */}
            <Button
              type="submit"
              disabled={isProcessing || sdkLoading || !cashfree}
              className="w-full bg-gradient-to-r from-gaming-pink-primary to-gaming-pink-secondary hover:from-gaming-pink-secondary hover:to-gaming-pink-accent text-gaming-pink-foreground font-medium py-3 relative overflow-hidden group transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100"
            >
              {sdkLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading Payment System...</span>
                </div>
              ) : isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span>Donate Now</span>
                  <Sparkles className="h-4 w-4 group-hover:animate-pulse-glow" />
                </div>
              )}
              
              {/* Button shine effect */}
              <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </Button>
          </form>

          {/* Status messages */}
          {sdkError && (
            <div className="text-center pt-4 border-t border-gaming-pink-primary/20">
              <p className="text-sm text-destructive">{sdkError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()} 
                className="mt-2"
              >
                Refresh Page
              </Button>
            </div>
          )}
          
          {!sdkError && (
            <div className="text-center pt-4 border-t border-gaming-pink-primary/20">
              <p className="text-xs text-muted-foreground">
                💝 Every donation helps grow the gaming community
              </p>
              {sdkLoading && (
                <p className="text-xs text-gaming-pink-primary mt-1">
                  🔄 Loading secure payment system...
                </p>
              )}
              {cashfree && !sdkLoading && (
                <p className="text-xs text-gaming-pink-primary mt-1">
                  ✅ Payment system ready
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChiaGaming;