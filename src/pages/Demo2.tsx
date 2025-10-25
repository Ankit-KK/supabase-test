import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Gamepad2, Heart, Sparkles } from "lucide-react";
import { load } from '@cashfreepayments/cashfree-js';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import VoiceRecorder from "@/components/VoiceRecorder";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

const Demo2 = () => {
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
  const [selectedEmoji, setSelectedEmoji] = useState<string>('');
  const [selectedEmoteUrl, setSelectedEmoteUrl] = useState<string>('');
  
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  const getVoiceDuration = (amount: number) => {
    if (amount >= 500) return 30;
    if (amount >= 250) return 20;
    if (amount >= 150) return 15;
    return 10;
  };

  const currentAmount = parseFloat(formData.amount) || 0;
  const voiceRecorder = useVoiceRecorder(getVoiceDuration(currentAmount));
  
  const availableEmotes = [
    { name: "emojis1", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/emojis1-Photoroom.png" },
    { name: "image-10", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(10).png" },
    { name: "image-1", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(1).png" },
    { name: "image-2", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(2).png" },
    { name: "image-3", url: "https://vsevsjvtrshgeiudrnth.supabase.co/storage/v1/object/public/chiaa-emotes/image-Photoroom%20(3).png" },
  ];

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        setSdkLoading(true);
        setSdkError(null);
        const cf = await load({ mode: "production" });
        setCashfree(cf);
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
          .rpc('get_streamer_public_settings', { slug: 'demo2' });
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    
    if (!formData.name?.trim()) {
      toast({ title: "Name Required", description: "Please enter your name.", variant: "destructive" });
      return;
    }

    if (donationType === 'voice' && !hasVoiceRecording) {
      toast({ title: "Voice Message Required", description: "Please record a voice message for your donation.", variant: "destructive" });
      return;
    }

    if (donationType === 'message' && !formData.message?.trim()) {
      toast({ title: "Message Required", description: "Please enter a message for your donation.", variant: "destructive" });
      return;
    }

    if (!amount || amount < 1) {
      toast({ title: "Invalid Amount", description: "Please enter a valid donation amount.", variant: "destructive" });
      return;
    }

    // Validate minimum amounts based on donation type
    if (donationType === 'message' && amount < 70) {
      toast({
        title: "Insufficient Amount",
        description: "Text messages with TTS require a minimum donation of ₹70.",
        variant: "destructive",
      });
      return;
    }

    if (donationType === 'voice' && amount < 150) {
      toast({
        title: "Insufficient Amount",
        description: "Voice messages require a minimum donation of ₹150.",
        variant: "destructive",
      });
      return;
    }

    if (!cashfree) {
      toast({ title: "Payment System Not Ready", description: "Please wait for the payment system to load or refresh the page.", variant: "destructive" });
      return;
    }

    setShowPhoneDialog(true);
  };

  const handlePaymentAfterPhone = async () => {
    setIsProcessing(true);
    let data: any = null;

    try {
      const amount = parseFloat(formData.amount);
      let tempVoice: string | null = null;
      
      if (donationType === 'voice' && voiceRecorder.audioBlob) {
        const reader = new FileReader();
        tempVoice = await new Promise((resolve) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });
      }

      const response = await supabase.functions.invoke('create-payment-order-demo2', {
        body: {
          name: formData.name.trim(),
          amount: amount,
          message: donationType === 'message' ? formData.message.trim() : 
                  donationType === 'voice' ? 'Voice message donation' : '',
          phone: phoneNumber,
          voiceData: tempVoice
        }
      });

      data = response.data;
      const error = response.error;

      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to create payment order');
      }

      const orderId = data.order_id;

      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_modal",
        appearance: { width: "500px", height: "700px" },
        onSuccess: function(data: any) { console.log("Payment successful:", data); },
        onFailure: function(data: any) { console.log("Payment failed:", data); }
      };

      setTimeout(async () => {
        const result = await cashfree.checkout(checkoutOptions);
        
        if (result.error) {
          navigate(`/status?order_id=${orderId}&status=pending`);
        } else if (result.paymentDetails) {
          navigate(`/status?order_id=${orderId}&status=success`);
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
    const phoneRegex = /^[6-9]\d{9}$/;
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

  const handleVoiceRecorded = (hasRecording: boolean, duration: number) => {
    setHasVoiceRecording(hasRecording);
    setVoiceDuration(duration);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-cyan-600/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <Card className="w-full max-w-md mx-auto bg-card/95 backdrop-blur-sm border-cyan-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-cyan-600/20 to-cyan-400/20 opacity-50 blur-xl"></div>
        
        <CardHeader className="text-center relative z-10">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-2 text-cyan-500">
              <Gamepad2 className="h-8 w-8" />
              <Sparkles className="h-6 w-6 animate-pulse" />
              <Heart className="h-6 w-6 text-cyan-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-cyan-600 bg-clip-text text-transparent">
            Demo Streamer 2
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Support Demo Streamer 2 with your donation
          </p>
        </CardHeader>

        <CardContent className="space-y-6 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-cyan-500">Your Name *</label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleInputChange}
                className="border-cyan-500/30 focus:border-cyan-500 focus:ring-cyan-500/20"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-cyan-500">Choose your donation type</label>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => handleDonationTypeChange('message')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    donationType === 'message' ? 'border-cyan-500 bg-cyan-500/10' : 'border-cyan-500/30 hover:border-cyan-500/50'
                  }`}>
                  <div className="text-center">
                    <div className="text-base mb-1">💬</div>
                    <div className="font-medium text-xs">Text Message</div>
                    <div className="text-xs text-muted-foreground">Min: ₹70</div>
                  </div>
                </button>
                <button type="button" onClick={() => handleDonationTypeChange('voice')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    donationType === 'voice' ? 'border-cyan-500 bg-cyan-500/10' : 'border-cyan-500/30 hover:border-cyan-500/50'
                  }`}>
                  <div className="text-center">
                    <div className="text-base mb-1">🎤</div>
                    <div className="font-medium text-xs">Voice Message</div>
                    <div className="text-xs text-muted-foreground">Min: ₹150</div>
                  </div>
                </button>
                <button type="button" onClick={() => handleDonationTypeChange('hyperemote')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    donationType === 'hyperemote' ? 'border-cyan-500 bg-cyan-500/10' : 'border-cyan-500/30 hover:border-cyan-500/50'
                  }`}>
                  <div className="text-center">
                    <div className="text-base mb-1">⚡</div>
                    <div className="font-medium text-xs">Hyperemote</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium text-cyan-500">Amount (₹) *</label>
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder={
                  donationType === 'message' ? 'Min: ₹70' : 
                  donationType === 'voice' ? 'Min: ₹150' : 
                  'Enter amount'
                }
                value={formData.amount}
                onChange={handleInputChange}
                className="border-cyan-500/30 focus:border-cyan-500 focus:ring-cyan-500/20"
                required
              />
            </div>

            {donationType === 'message' && (
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-cyan-500">Your Message *</label>
                <Input
                  id="message"
                  name="message"
                  placeholder="Enter your message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="border-cyan-500/30 focus:border-cyan-500 focus:ring-cyan-500/20"
                  required
                />
              </div>
            )}

            {donationType === 'voice' && (
              <VoiceRecorder
                onRecordingComplete={handleVoiceRecorded}
                maxDurationSeconds={getVoiceDuration(currentAmount)}
                controller={voiceRecorder}
              />
            )}

            <Button
              type="submit"
              disabled={isProcessing || sdkLoading || !!sdkError}
              className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-medium py-6 rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              {isProcessing ? 'Processing...' : `Donate ₹${formData.amount || '0'}`}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Mobile Number</DialogTitle>
            <DialogDescription>We need your mobile number for payment processing</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="10-digit mobile number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              maxLength={10}
            />
            {phoneError && <p className="text-sm text-destructive">{phoneError}</p>}
            <Button onClick={handlePhoneSubmit} className="w-full">Continue to Payment</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Demo2;
