import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Music, Heart, Sparkles } from "lucide-react";
import { load } from '@cashfreepayments/cashfree-js';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import VoiceRecorder from "@/components/VoiceRecorder";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

const MusicStream = () => {
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
  const [donationType, setDonationType] = useState<'message' | 'voice' | 'hyperemote'>('message');
  const [streamerSettings, setStreamerSettings] = useState<any>(null);
  const [hasVoiceRecording, setHasVoiceRecording] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [showHyperemoteEffect, setShowHyperemoteEffect] = useState(false);
  
  // Phone number dialog states
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  // Calculate voice recording duration based on amount
  const getVoiceDuration = (amount: number) => {
    if (amount >= 500) return 30;
    if (amount >= 200) return 20;
    if (amount >= 100) return 15;
    return 10;
  };

  // Voice recorder instance - dynamically update duration based on amount
  const currentAmount = parseFloat(formData.amount) || 0;
  const voiceRecorder = useVoiceRecorder(getVoiceDuration(currentAmount));


  // Initialize Cashfree SDK and fetch streamer settings
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

    const fetchStreamerSettings = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_streamer_public_settings', { slug: 'musicstream' });

        if (error) throw error;
        if (data && data.length > 0) setStreamerSettings(data[0]);
      } catch (error) {
        console.error('Failed to fetch streamer settings:', error);
      }
    };
    
    initializeSDK();
    fetchStreamerSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs first
    const amount = parseFloat(formData.amount);
    
    if (!formData.name?.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name.",
        variant: "destructive",
      });
      return;
    }

    if (donationType === 'voice' && !hasVoiceRecording) {
      toast({
        title: "Voice Message Required", 
        description: "Please record a voice message for your donation.",
        variant: "destructive",
      });
      return;
    }

    if (donationType === 'message' && !formData.message?.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message for your donation.", 
        variant: "destructive",
      });
      return;
    }

    if (!amount || amount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid donation amount.",
        variant: "destructive",
      });
      return;
    }

    if (!cashfree) {
      toast({
        title: "Payment System Not Ready",
        description: "Please wait for the payment system to load or refresh the page.",
        variant: "destructive",
      });
      return;
    }

    // Show phone dialog after validation passes
    setShowPhoneDialog(true);
  };

  const handlePaymentAfterPhone = async () => {
    setIsProcessing(true);
    let data: any = null;

    try {
      const amount = parseFloat(formData.amount);

      // Convert voice data to base64 for temporary storage if needed
      let voiceDataBase64: string | null = null;
      if (donationType === 'voice' && voiceRecorder.audioBlob) {
        console.log('Converting voice recording to base64 for temporary storage');
        const reader = new FileReader();
        voiceDataBase64 = await new Promise((resolve) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });
      }

      // Create order via Supabase edge function
      const response = await supabase.functions.invoke('create-payment-order-musicstream', {
        body: {
          name: formData.name.trim(),
          amount: amount,
          message: donationType === 'message' ? formData.message.trim() : 
                  donationType === 'voice' ? 'Send a Voice message' : '',
          phone: phoneNumber?.trim() || undefined,
          voiceData: voiceDataBase64
        }
      });

      data = response.data;
      const error = response.error;

      if (error || !data?.payment_session_id) {
        throw new Error(data?.error || 'Failed to create payment order');
      }

      const orderId = data.order_id;

      // Initialize Cashfree checkout
      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_modal",
        appearance: {
          width: "500px",
          height: "700px"
        },
        onSuccess: function(data: any) {
          console.log("Payment successful:", data);
        },
        onFailure: function(data: any) {
          console.log("Payment failed:", data);
        }
      };

      // Add a small delay to ensure proper focus handling
      setTimeout(async () => {
        const result = await cashfree.checkout(checkoutOptions);
        
        if (result.error) {
          console.log("Payment cancelled or error:", result.error);
          navigate(`/status?order_id=${orderId}&status=pending`);
        } else if (result.paymentDetails) {
          console.log("Payment completed:", result.paymentDetails);
          navigate(`/status?order_id=${orderId}&status=success`);
        } else if (result.redirect) {
          console.log("Payment will be redirected");
          navigate(`/status?order_id=${orderId}&status=pending`);
        } else {
          navigate(`/status?order_id=${orderId}&status=pending`);
        }
      }, 100);

    } catch (error) {
      console.error('Payment error:', error);
      const orderId = data?.order_id;
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
      setShowPhoneDialog(false);
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile number format
    return phoneRegex.test(phone);
  };

  const handlePhoneSubmit = () => {
    setPhoneError('');
    
    if (!phoneNumber.trim()) {
      setPhoneError('Please enter your mobile number');
      return;
    }
    
    if (!validatePhoneNumber(phoneNumber)) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }
    
    handlePaymentAfterPhone();
  };

  const handleDonationTypeChange = (type: 'message' | 'voice' | 'hyperemote') => {
    setDonationType(type);
    if (type === 'hyperemote') {
      const minAmount = streamerSettings?.hyperemotes_min_amount || 50;
      setFormData(prev => ({ ...prev, amount: minAmount.toString(), message: '' }));
      setShowHyperemoteEffect(true);
      setTimeout(() => setShowHyperemoteEffect(false), 3000);
    } else {
      setFormData(prev => ({ ...prev, amount: '' }));
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-purple-400/10 rounded-full blur-2xl animate-pulse"></div>
      </div>

      <Card className="w-full max-w-md mx-auto bg-card/95 backdrop-blur-sm border-purple-500/20 shadow-2xl relative overflow-hidden">
        {/* Card glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-purple-600/20 to-purple-400/20 opacity-50 blur-xl"></div>
        
        <CardHeader className="text-center relative z-10">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-2 text-purple-500">
              <Music className="h-8 w-8" />
              <Sparkles className="h-6 w-6 animate-pulse" />
              <Heart className="h-6 w-6 text-purple-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent">
            MusicStream
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Support MusicStream with your donation
          </p>
        </CardHeader>

        <CardContent className="space-y-6 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-purple-500">
                Your Name *
              </label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleInputChange}
                className="border-purple-500/30 focus:border-purple-500 focus:ring-purple-500/20"
                required
              />
            </div>

            {/* Donation Type Selection */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-purple-500">
                  Choose your donation type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDonationTypeChange('message')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      donationType === 'message'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-purple-500/30 hover:border-purple-500/50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-base mb-1">💬</div>
                      <div className="font-medium text-xs">Text Message</div>
                      <div className="text-xs text-muted-foreground">Type message</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDonationTypeChange('voice')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      donationType === 'voice'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-purple-500/30 hover:border-purple-500/50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-base mb-1">🎤</div>
                      <div className="font-medium text-xs">Voice Message</div>
                      <div className="text-xs text-muted-foreground">Record voice</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDonationTypeChange('hyperemote')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      donationType === 'hyperemote'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-purple-500/30 hover:border-purple-500/50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-base mb-1">🎉</div>
                      <div className="font-medium text-xs">Hyperemotes</div>
                      <div className="text-xs text-muted-foreground">₹{streamerSettings?.hyperemotes_min_amount || 50}+ celebration</div>
                    </div>
                  </button>
                </div>
            </div>

            {/* Amount Field */}
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium text-purple-500">
                Amount (₹) *
              </label>
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder={donationType === 'hyperemote' ? `₹${streamerSettings?.hyperemotes_min_amount || 50} minimum` : 'Enter amount'}
                value={formData.amount}
                onChange={handleInputChange}
                className="border-purple-500/30 focus:border-purple-500 focus:ring-purple-500/20"
                min={donationType === 'hyperemote' ? (streamerSettings?.hyperemotes_min_amount || 50).toString() : '1'}
                max="100000"
                disabled={donationType === 'hyperemote'}
                required
              />
              {donationType === 'hyperemote' && (
                <p className="text-xs text-muted-foreground">Hyperemotes are fixed at ₹1</p>
              )}
            </div>

            {/* Message Field */}
            {donationType === 'message' && (
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-purple-500">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Enter your message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-purple-500/30 rounded-lg bg-background/50 backdrop-blur-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none resize-none"
                  rows={3}
                  maxLength={500}
                  required
                />
                <div className="text-xs text-muted-foreground text-right">
                  {formData.message.length}/500 characters
                </div>
              </div>
            )}

            {donationType === 'voice' && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-purple-500">
                  Record Voice Message *
                </label>
                <VoiceRecorder
                  onRecordingComplete={(hasRecording, duration) => {
                    setHasVoiceRecording(hasRecording);
                    setVoiceDuration(duration);
                  }}
                  maxDurationSeconds={60}
                  controller={voiceRecorder}
                />
              </div>
            )}

            {/* Hyperemote Message */}
            {donationType === 'hyperemote' && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-purple-500">
                  Celebration Message (Optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Add a message to your celebration!"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-purple-500/30 rounded-lg bg-background/50 backdrop-blur-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none resize-none"
                  rows={3}
                  maxLength={500}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {formData.message.length}/500 characters
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={isProcessing || sdkLoading || !!sdkError}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : sdkLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Loading Payment System...</span>
                </div>
              ) : sdkError ? (
                <span className="text-red-300">Payment System Error</span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span>Donate ₹{formData.amount || '0'}</span>
                </span>
              )}
            </Button>

            {sdkError && (
              <div className="text-center">
                <p className="text-red-500 text-sm">{sdkError}</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="mt-2 text-xs"
                >
                  Refresh Page
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Phone Number Dialog */}
      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-purple-500" />
              Complete Your Donation
            </DialogTitle>
            <DialogDescription>
              Please enter your mobile number to complete the payment process.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Mobile Number *
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setPhoneError('');
                }}
                className={`${phoneError ? 'border-red-500' : ''}`}
                maxLength={10}
              />
              {phoneError && (
                <p className="text-red-500 text-sm">{phoneError}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPhoneDialog(false)}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePhoneSubmit}
                className="flex-1 bg-purple-500 hover:bg-purple-600"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </div>
                ) : (
                  'Continue to Payment'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hyperemote Effect */}
      {showHyperemoteEffect && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-bounce text-6xl">🎉</div>
        </div>
      )}
    </div>
  );
};

export default MusicStream;