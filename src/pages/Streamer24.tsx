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

const Streamer24 = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getCharacterLimit, getVoiceDuration } = useDonationLimits();
  const brandColor = '#6366f1';
  
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
      const { data } = await supabase.rpc('get_streamer_public_settings', { slug: 'streamer24' });
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
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDonationTypeChange = (type: 'message' | 'voice' | 'hyperemote') => {
    setDonationType(type);
    
    if (type === 'hyperemote') {
      setFormData(prev => ({ ...prev, amount: '4' }));
      setIsAmountLocked(true);
      setShowHyperemoteEffect(true);
      setTimeout(() => setShowHyperemoteEffect(false), 2000);
    } else {
      if (isAmountLocked && donationType === 'hyperemote') {
        setIsAmountLocked(false);
      }
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setPhoneError('Please enter a valid 10-digit mobile number starting with 6-9');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.amount) {
      toast({ title: "Missing Information", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    if (donationType === 'message' && !formData.message.trim()) {
      toast({ title: "Missing Message", description: "Please enter a message for your donation.", variant: "destructive" });
      return;
    }
    if (donationType === 'voice' && !voiceRecorder.audioBlob) {
      toast({ title: "Missing Voice", description: "Please record a voice message.", variant: "destructive" });
      return;
    }
    
    // Validate minimum amounts based on donation type
    const amount = parseFloat(formData.amount);
    if (donationType === 'message' && amount < 1) {
      toast({ title: "Insufficient Amount", description: "Text messages require ₹1 minimum. TTS from ₹2+.", variant: "destructive" });
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

  const handlePhoneSubmit = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }

    setIsSubmitting(true);
    let data: any = null;
    try {
      const amount = parseFloat(formData.amount);
      let voiceDataBase64: string | null = null;
      if (donationType === 'voice' && voiceRecorder.audioBlob) {
        const reader = new FileReader();
        voiceDataBase64 = await new Promise((resolve) => {
          reader.onload = () => {
            const base64String = reader.result as string;
            resolve(base64String);
          };
          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });
      }

      const response = await supabase.functions.invoke('create-payment-order-streamer24', {
        body: {
          name: formData.name,
          amount,
          message: donationType === 'message' || donationType === 'hyperemote' ? formData.message : null,
          voiceBlob: voiceDataBase64,
          phone: phoneNumber
        },
      });

      if (response.error) throw response.error;
      data = response.data;

      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        returnUrl: `${window.location.origin}/streamer24`,
      };

      if (cashfree) {
        setShowPhoneDialog(false);
        cashfree.checkout(checkoutOptions);
      }
    } catch (error: any) {
      toast({ title: 'Payment Failed', description: error.message || 'An error occurred', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const characterLimit = getCharacterLimit(currentAmount);
  const isHyperemote = hyperemotesEnabled && currentAmount >= hyperemotesMinAmount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none opacity-30" style={{ background: `radial-gradient(circle at 50% 50%, ${brandColor}15 0%, transparent 50%)` }} />

      {showHyperemoteEffect && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-ping absolute h-32 w-32 rounded-full opacity-75" style={{ backgroundColor: brandColor }} />
          <Sparkles className="h-16 w-16 animate-pulse" style={{ color: brandColor }} />
        </div>
      )}

      <Card className="w-full max-w-md p-8 space-y-6 backdrop-blur-xl bg-card/80 border-2 shadow-2xl relative z-10">
        <CardHeader className="text-center space-y-4 p-0">
          <div className="flex justify-center">
            <div className="p-4 rounded-full shadow-lg" style={{ backgroundColor: `${brandColor}20` }}>
              <Zap className="h-12 w-12" style={{ color: brandColor }} />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
            Support Streamer24
          </CardTitle>
          <p className="text-muted-foreground text-sm">Choose your support level and make their day special! ✨</p>
        </CardHeader>

        <CardContent className="space-y-6 p-0">
          <DonationTypeSelector
            donationType={donationType}
            onTypeChange={handleDonationTypeChange}
            brandColor={brandColor}
          />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium" style={{ color: brandColor }}>Your Name</label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleInputChange}
                className="focus:ring-opacity-20"
                style={{ borderColor: `${brandColor}50` }}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium" style={{ color: brandColor }}>
                Amount (₹) {donationType === 'hyperemote' && '- Locked for Hyperemote'}
              </label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="1"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={handleInputChange}
                disabled={isAmountLocked}
                className="focus:ring-opacity-20"
                style={{ borderColor: `${brandColor}50` }}
                required
              />
              {donationType === 'voice' && currentAmount >= 150 && (
                <p className="text-xs" style={{ color: brandColor }}>Voice limit: {maxVoiceDuration}s</p>
              )}
              {donationType === 'hyperemote' && (
                <p className="text-xs" style={{ color: brandColor }}>Unlimited message length!</p>
              )}
            </div>

            {donationType === 'message' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="message" className="text-sm font-medium" style={{ color: brandColor }}>Your Message</label>
                  <span className="text-xs text-muted-foreground">{formData.message.length}/{characterLimit}</span>
                </div>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Your message to the streamer..."
                  value={formData.message}
                  onChange={handleInputChange}
                  className="focus:ring-opacity-20"
                  style={{ borderColor: `${brandColor}50` }}
                  maxLength={characterLimit}
                  rows={4}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {currentAmount >= 200 ? '✨ 250 chars allowed!' : currentAmount >= 100 ? '200 chars allowed' : '100 chars allowed (increase amount for more)'}
                </p>
              </div>
            )}

            {donationType === 'hyperemote' && (
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium" style={{ color: brandColor }}>Celebration Message (Optional)</label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="focus:ring-opacity-20"
                  style={{ borderColor: `${brandColor}50` }}
                  maxLength={200}
                  rows={3}
                />
              </div>
            )}

            {donationType === 'voice' && (
              <EnhancedVoiceRecorder
                onRecordingComplete={(hasRecording, duration) => {
                  setHasVoiceRecording(hasRecording);
                  setVoiceDuration(duration);
                }}
                maxDurationSeconds={maxVoiceDuration}
                controller={voiceRecorder}
                requiredAmount={2}
                currentAmount={currentAmount}
                brandColor={brandColor}
              />
            )}

            <Button
              type="submit"
              className="w-full gap-2 text-white"
              style={{ backgroundColor: brandColor }}
              disabled={isSubmitting || sdkLoading}
            >
              {isSubmitting ? 'Processing...' : sdkLoading ? 'Loading...' : (
                <>
                  <Heart className="h-4 w-4" />
                  Donate Now
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <EnhancedPhoneDialog
        open={showPhoneDialog}
        onOpenChange={setShowPhoneDialog}
        phoneNumber={phoneNumber}
        onPhoneChange={(phone) => {
          setPhoneNumber(phone);
          setPhoneError('');
        }}
        phoneError={phoneError}
        onContinue={handlePhoneSubmit}
        isSubmitting={isSubmitting}
        brandColor={brandColor}
      />
    </div>
  );
};

export default Streamer24;
