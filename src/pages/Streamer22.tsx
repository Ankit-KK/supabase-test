import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { load } from '@cashfreepayments/cashfree-js';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Heart, Zap } from 'lucide-react';
import EnhancedVoiceRecorder from '@/components/EnhancedVoiceRecorder';
import { DonationTypeSelector } from '@/components/DonationTypeSelector';
import { EnhancedPhoneDialog } from '@/components/EnhancedPhoneDialog';
import { useDonationLimits } from '@/hooks/useDonationLimits';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

const Streamer22 = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getCharacterLimit, getVoiceDuration } = useDonationLimits();
  const brandColor = '#8b5cf6';
  
  const [cashfree, setCashfree] = useState<any>(null);
  const [sdkLoading, setSdkLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', amount: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [donationType, setDonationType] = useState<'message' | 'voice' | 'hyperemote'>('message');
  const [hyperemotesEnabled, setHyperemotesEnabled] = useState(false);
  const [hyperemotesMinAmount, setHyperemotesMinAmount] = useState(50);
  const [hasVoiceRecording, setHasVoiceRecording] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [showHyperemoteEffect, setShowHyperemoteEffect] = useState(false);
  const [isAmountLocked, setIsAmountLocked] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const currentAmount = parseFloat(formData.amount) || 0;
  const maxVoiceDuration = getVoiceDuration(currentAmount);
  const voiceRecorder = useVoiceRecorder(maxVoiceDuration);

  useEffect(() => {
    const initializeCashfree = async () => {
      try {
        setSdkLoading(true);
        const cf = await load({ mode: 'production' });
        setCashfree(cf);
        toast({ title: "Payment System Ready", description: "You can now make donations safely." });
      } catch (error) {
        toast({ title: "Payment System Error", description: "Failed to load payment system.", variant: "destructive" });
      } finally {
        setSdkLoading(false);
      }
    };
    initializeCashfree();

    const fetchStreamerSettings = async () => {
      const { data } = await supabase.rpc('get_streamer_public_settings', { slug: 'streamer22' });
      if (data?.[0]) {
        setHyperemotesEnabled(data[0].hyperemotes_enabled);
        setHyperemotesMinAmount(data[0].hyperemotes_min_amount);
      }
    };
    fetchStreamerSettings();
  }, []);

  useEffect(() => {
    if (voiceRecorder.isRecording) {
      setIsAmountLocked(true);
    } else if (!voiceRecorder.audioBlob) {
      setIsAmountLocked(false);
    }
  }, [voiceRecorder.isRecording, voiceRecorder.audioBlob]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'amount' && donationType === 'message') {
      const newAmount = parseFloat(value) || 40;
      const newCharLimit = getCharacterLimit(newAmount);
      if (formData.message.length > newCharLimit) {
        toast({ title: "Message Shortened", description: `Message limited to ${newCharLimit} characters.` });
        setFormData(prev => ({ ...prev, [name]: value, message: prev.message.substring(0, newCharLimit) }));
        return;
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDonationTypeChange = (type: 'message' | 'voice' | 'hyperemote') => {
    setDonationType(type);
    if (type === 'hyperemote') {
      const minAmount = hyperemotesMinAmount || 50;
      setFormData(prev => ({ ...prev, amount: minAmount.toString(), message: 'Hyperemote celebration! 🎉' }));
      setShowHyperemoteEffect(true);
      setTimeout(() => setShowHyperemoteEffect(false), 3000);
    } else {
      setFormData(prev => ({ ...prev, amount: '' }));
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (!formData.name?.trim()) {
      toast({ title: "Name Required", description: "Please enter your name.", variant: "destructive" });
      return;
    }
    if (donationType === 'voice' && !hasVoiceRecording) {
      toast({ title: "Voice Message Required", description: "Please record a voice message.", variant: "destructive" });
      return;
    }
    if (donationType === 'message' && !formData.message?.trim()) {
      toast({ title: "Message Required", description: "Please enter a message.", variant: "destructive" });
      return;
    }
    if (donationType === 'message' && formData.message?.trim()) {
      const charLimit = getCharacterLimit(amount);
      if (formData.message.length > charLimit) {
        toast({ title: "Message Too Long", description: `Maximum ${charLimit} characters allowed.`, variant: "destructive" });
        return;
      }
    }
    if (!amount || amount < 1) {
      toast({ title: "Invalid Amount", description: "Please enter a valid donation amount.", variant: "destructive" });
      return;
    }
    if (donationType === 'message' && amount < 3) {
      toast({ title: "Insufficient Amount", description: "Text messages require ₹3 minimum.", variant: "destructive" });
      return;
    }
    if (donationType === 'voice' && amount < 2) {
      toast({ title: "Insufficient Amount", description: "Voice messages require ₹2 minimum.", variant: "destructive" });
      return;
    }
    if (!cashfree) {
      toast({ title: "Payment System Not Ready", description: "Please wait for payment system to load.", variant: "destructive" });
      return;
    }
    setShowPhoneDialog(true);
  };

  const handlePaymentAfterPhone = async () => {
    setIsSubmitting(true);
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
      const response = await supabase.functions.invoke('create-payment-order-streamer22', {
        body: {
          name: formData.name.trim(),
          amount: amount,
          message: donationType === 'message' ? formData.message.trim() : donationType === 'voice' ? 'Sent a Voice message' : donationType === 'hyperemote' ? formData.message.trim() : '',
          phone: phoneNumber?.trim() || undefined,
          voiceData: voiceDataBase64,
          isHyperemote: donationType === 'hyperemote'
        }
      });
      data = response.data;
      const error = response.error;
      if (error || !data?.success) throw new Error(data?.error || 'Failed to create payment order');
      const orderId = data.order_id;
      const checkoutOptions = { paymentSessionId: data.payment_session_id, redirectTarget: "_modal", appearance: { width: "500px", height: "700px" } };
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
      const orderId = data?.order_id;
      if (orderId) {
        navigate(`/status?order_id=${orderId}&status=error`);
      } else {
        toast({ title: "Payment Failed", description: error instanceof Error ? error.message : "Something went wrong.", variant: "destructive" });
      }
    } finally {
      setIsSubmitting(false);
      setShowPhoneDialog(false);
    }
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

  const isHyperemote = hyperemotesEnabled && parseFloat(formData.amount) >= hyperemotesMinAmount;
  const characterLimit = getCharacterLimit(currentAmount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: `${brandColor}20` }}></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: `${brandColor}30` }}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 rounded-full blur-2xl animate-pulse" style={{ backgroundColor: `${brandColor}15` }}></div>
      </div>
      <Card className="w-full max-w-md mx-auto bg-card/95 backdrop-blur-sm shadow-2xl relative overflow-hidden" style={{ borderColor: `${brandColor}40` }}>
        <div className="absolute inset-0 opacity-50 blur-xl" style={{ background: `linear-gradient(135deg, ${brandColor}30, ${brandColor}20, ${brandColor}30)` }}></div>
        <CardHeader className="text-center relative z-10">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-2" style={{ color: brandColor }}>
              <Zap className="h-8 w-8" />
              <Sparkles className="h-6 w-6 animate-pulse" />
              <Heart className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, ${brandColor}, ${brandColor}dd)` }}>
            Streamer 22
          </CardTitle>
          <p className="text-muted-foreground text-sm">Support with your donation</p>
        </CardHeader>
        <CardContent className="space-y-6 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium" style={{ color: brandColor }}>Your Name *</label>
              <Input id="name" name="name" placeholder="Enter your name" value={formData.name} onChange={handleInputChange} style={{ borderColor: `${brandColor}50` }} required />
            </div>
            <DonationTypeSelector donationType={donationType} onTypeChange={handleDonationTypeChange} hyperemotesMinAmount={hyperemotesMinAmount} brandColor={brandColor} />
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium" style={{ color: brandColor }}>Amount (₹) *</label>
              <Input id="amount" name="amount" type="number" placeholder={donationType === 'message' ? 'Min: ₹1' : donationType === 'voice' ? 'Min: ₹2' : `Min: ₹${hyperemotesMinAmount}`} value={formData.amount} onChange={handleInputChange} style={{ borderColor: `${brandColor}50` }} disabled={isAmountLocked || donationType === 'hyperemote'} required />
              {donationType === 'voice' && currentAmount >= 150 && <p className="text-xs text-muted-foreground">🎤 Voice duration: {getVoiceDuration(currentAmount)} seconds</p>}
              {isHyperemote && <div className="text-sm p-3 rounded-lg animate-pulse" style={{ backgroundColor: `${brandColor}20`, color: brandColor }}>🎉 Hyperemote! Auto-approved celebration message!</div>}
            </div>
            {donationType === 'message' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="message" className="text-sm font-medium" style={{ color: brandColor }}>Message *</label>
                  <span className="text-xs text-muted-foreground">{formData.message.length}/{characterLimit}</span>
                </div>
                <Textarea id="message" name="message" placeholder="Your message to the streamer..." value={formData.message} onChange={handleInputChange} style={{ borderColor: `${brandColor}50` }} maxLength={characterLimit} rows={4} required />
                <p className="text-xs text-muted-foreground">{currentAmount >= 200 ? '✨ 250 chars allowed!' : currentAmount >= 100 ? '200 chars allowed' : '100 chars allowed (increase amount for more)'}</p>
              </div>
            )}
            {donationType === 'hyperemote' && (
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium" style={{ color: brandColor }}>Celebration Message (Optional)</label>
                <Textarea id="message" name="message" value={formData.message} onChange={handleInputChange} style={{ borderColor: `${brandColor}50` }} maxLength={200} rows={3} />
              </div>
            )}
            {donationType === 'voice' && <EnhancedVoiceRecorder onRecordingComplete={(hasRecording, duration) => { setHasVoiceRecording(hasRecording); setVoiceDuration(duration); }} maxDurationSeconds={maxVoiceDuration} controller={voiceRecorder} requiredAmount={150} currentAmount={currentAmount} brandColor={brandColor} />}
            <Button type="submit" className="w-full gap-2 text-white" style={{ backgroundColor: brandColor }} disabled={isSubmitting || sdkLoading}>
              {isSubmitting ? 'Processing...' : sdkLoading ? 'Loading...' : (<><Heart className="h-4 w-4" />Donate Now</>)}
            </Button>
          </form>
        </CardContent>
      </Card>
      <EnhancedPhoneDialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog} phoneNumber={phoneNumber} onPhoneChange={(phone) => { setPhoneNumber(phone); setPhoneError(''); }} phoneError={phoneError} onContinue={handlePhoneSubmit} isSubmitting={isSubmitting} brandColor={brandColor} />
    </div>
  );
};

export default Streamer22;
