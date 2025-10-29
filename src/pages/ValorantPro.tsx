import React, { useState, useEffect, useRef } from "react";
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

const ValorantPro = () => {
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
  const [isAmountLocked, setIsAmountLocked] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  const getCharacterLimit = (amount: number): number => {
    if (amount >= 200) return 250;
    if (amount >= 100) return 200;
    if (amount >= 40) return 100;
    return 100;
  };
  
  const getVoiceDuration = (amount: number): number => {
    if (amount >= 250) return 30;
    if (amount >= 200) return 20;
    if (amount >= 150) return 15;
    return 15;
  };

  const currentAmount = parseFloat(formData.amount) || 0;
  const maxVoiceDuration = getVoiceDuration(currentAmount);
  const voiceRecorder = useVoiceRecorder(maxVoiceDuration);
  
  useEffect(() => {
    if (voiceRecorder.isRecording) {
      setIsAmountLocked(true);
    } else if (!voiceRecorder.audioBlob) {
      setIsAmountLocked(false);
    }
  }, [voiceRecorder.isRecording, voiceRecorder.audioBlob]);

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
          .rpc('get_streamer_public_settings', { slug: 'valorantpro' });
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
    
    if (name === 'amount' && donationType === 'message') {
      const newAmount = parseFloat(value) || 40;
      const newCharLimit = getCharacterLimit(newAmount);
      
      if (formData.message.length > newCharLimit) {
        toast({
          title: "Message Shortened",
          description: `Donation amount reduced. Message limited to ${newCharLimit} characters.`,
        });
        setFormData(prev => ({
          ...prev,
          [name]: value,
          message: prev.message.substring(0, newCharLimit)
        }));
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
    
    if (donationType === 'message' && formData.message?.trim()) {
      const charLimit = getCharacterLimit(amount);
      if (formData.message.length > charLimit) {
        toast({ title: "Message Too Long", description: `Your donation amount allows up to ${charLimit} characters.`, variant: "destructive" });
        return;
      }
    }

    if (!amount || amount < 1) {
      toast({ title: "Invalid Amount", description: "Please enter a valid donation amount.", variant: "destructive" });
      return;
    }

    if (donationType === 'message' && amount < 40) {
      toast({ title: "Insufficient Amount", description: "Text messages require a minimum donation of ₹40.", variant: "destructive" });
      return;
    }

    if (donationType === 'voice' && amount < 150) {
      toast({ title: "Insufficient Amount", description: "Voice messages require a minimum donation of ₹150.", variant: "destructive" });
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
      let voiceDataBase64: string | null = null;
      
      if (donationType === 'voice' && voiceRecorder.audioBlob) {
        const reader = new FileReader();
        voiceDataBase64 = await new Promise((resolve) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });
      }

      const response = await supabase.functions.invoke('create-payment-order-valorantpro', {
        body: {
          name: formData.name.trim(),
          amount: amount,
          message: donationType === 'message' ? formData.message.trim() : 
                  donationType === 'voice' ? 'Sent a Voice message' : 
                  donationType === 'hyperemote' ? formData.message.trim() : '',
          phone: phoneNumber?.trim() || undefined,
          voiceData: voiceDataBase64,
          isHyperemote: donationType === 'hyperemote'
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
      const minAmount = streamerSettings?.hyperemotes_min_amount || 1;
      setFormData(prev => ({ ...prev, amount: minAmount.toString(), message: 'Hyperemote celebration! 🎉' }));
      setShowHyperemoteEffect(true);
      setTimeout(() => setShowHyperemoteEffect(false), 3000);
    } else {
      setFormData(prev => ({ ...prev, amount: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-red-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-red-400/10 rounded-full blur-2xl animate-pulse"></div>
      </div>

      <Card className="w-full max-w-md mx-auto bg-card/95 backdrop-blur-sm border-red-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-red-600/20 to-red-400/20 opacity-50 blur-xl"></div>
        
        <CardHeader className="text-center relative z-10">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-2" style={{ color: '#ff4655' }}>
              <Gamepad2 className="h-8 w-8" />
              <Sparkles className="h-6 w-6 animate-pulse" />
              <Heart className="h-6 w-6" style={{ color: '#ff4655' }} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold" style={{ background: 'linear-gradient(to right, #ff4655, #ff6675)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ValorantPro
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Support ValorantPro with your donation
          </p>
        </CardHeader>

        <CardContent className="space-y-6 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ... rest of form identical to Ankit.tsx but with red/valorant theme ... */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium" style={{ color: '#ff4655' }}>Your Name *</label>
              <Input id="name" name="name" placeholder="Enter your name" value={formData.name} onChange={handleInputChange} required />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium" style={{ color: '#ff4655' }}>Choose your donation type</label>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => handleDonationTypeChange('message')} className={`p-3 rounded-lg border-2 transition-all ${donationType === 'message' ? 'border-red-500 bg-red-500/10' : 'border-red-500/30'}`}>
                  <div className="text-center"><div className="text-base mb-1">💬</div><div className="font-medium text-xs">Text Message</div><div className="text-xs text-muted-foreground">Min: ₹40</div></div>
                </button>
                <button type="button" onClick={() => handleDonationTypeChange('voice')} className={`p-3 rounded-lg border-2 transition-all ${donationType === 'voice' ? 'border-red-500 bg-red-500/10' : 'border-red-500/30'}`}>
                  <div className="text-center"><div className="text-base mb-1">🎤</div><div className="font-medium text-xs">Voice Message</div><div className="text-xs text-muted-foreground">Min: ₹150</div></div>
                </button>
                <button type="button" onClick={() => handleDonationTypeChange('hyperemote')} className={`p-3 rounded-lg border-2 transition-all ${donationType === 'hyperemote' ? 'border-purple-500 bg-purple-500/10' : 'border-purple-500/30'}`}>
                  <div className="text-center"><div className="text-base mb-1">🎉</div><div className="font-medium text-xs">Hyperemotes</div><div className="text-xs text-muted-foreground">₹{streamerSettings?.hyperemotes_min_amount || 1}+</div></div>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium" style={{ color: '#ff4655' }}>Amount (₹) *</label>
              <Input id="amount" name="amount" type="number" placeholder="Enter amount" value={formData.amount} onChange={handleInputChange} disabled={isAmountLocked} required />
              {isAmountLocked && <p className="text-xs text-yellow-600">Amount locked while recording</p>}
            </div>

            {donationType === 'message' && (
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium" style={{ color: '#ff4655' }}>Your Message *</label>
                <textarea id="message" name="message" placeholder="Type your message here..." value={formData.message} onChange={handleInputChange} className="w-full min-h-[100px] p-3 border rounded-md" maxLength={getCharacterLimit(currentAmount)} required />
                <div className="text-xs text-muted-foreground text-right">{formData.message.length}/{getCharacterLimit(currentAmount)} characters</div>
              </div>
            )}

            {donationType === 'voice' && (
              <div className="space-y-3">
                <label className="text-sm font-medium" style={{ color: '#ff4655' }}>Record Voice Message *</label>
                <VoiceRecorder
                  onRecordingComplete={(hasRecording, duration) => {
                    setHasVoiceRecording(hasRecording);
                    setVoiceDuration(duration);
                  }}
                  maxDurationSeconds={maxVoiceDuration}
                  controller={voiceRecorder}
                  requiredAmount={150}
                  currentAmount={currentAmount}
                />
              </div>
            )}

            <Button type="submit" className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700" disabled={isProcessing || sdkLoading || !!sdkError}>
              {isProcessing ? 'Processing...' : sdkLoading ? 'Loading...' : 'Donate Now'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Mobile Number</DialogTitle>
            <DialogDescription>Please provide your mobile number to proceed with payment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="10-digit mobile number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} maxLength={10} />
            {phoneError && <p className="text-sm text-red-500">{phoneError}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowPhoneDialog(false)}>Cancel</Button>
              <Button onClick={handlePhoneSubmit} disabled={isProcessing}>Continue to Payment</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ValorantPro;