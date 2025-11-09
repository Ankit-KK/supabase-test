import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { load } from '@cashfreepayments/cashfree-js';
import VoiceRecorder from '@/components/VoiceRecorder';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { DonationTypeSelector } from '@/components/DonationTypeSelector';
import { EnhancedPhoneDialog } from '@/components/EnhancedPhoneDialog';
import { useDonationLimits } from '@/hooks/useDonationLimits';
import { Star } from 'lucide-react';

const Streamer23 = () => {
  const { toast } = useToast();
  const { getCharacterLimit, getVoiceDuration } = useDonationLimits();
  const [cashfree, setCashfree] = useState<any>(null);
  const [donationType, setDonationType] = useState<'message' | 'voice' | 'hyperemote'>('message');
  const [formData, setFormData] = useState({ name: '', amount: '', message: '' });
  const [hasVoiceRecording, setHasVoiceRecording] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hyperemotesEnabled, setHyperemotesEnabled] = useState(false);
  const [hyperemotesMinAmount, setHyperemotesMinAmount] = useState(50);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  const currentAmount = parseFloat(formData.amount) || 0;
  const maxVoiceDuration = getVoiceDuration(currentAmount);
  const voiceRecorder = useVoiceRecorder(maxVoiceDuration);

  useEffect(() => {
    const initializeCashfree = async () => {
      const cf = await load({ mode: 'production' });
      setCashfree(cf);
    };
    initializeCashfree();

    const fetchStreamerSettings = async () => {
      const { data } = await supabase.rpc('get_streamer_public_settings', { slug: 'streamer23' });
      if (data?.[0]) {
        setHyperemotesEnabled(data[0].hyperemotes_enabled);
        setHyperemotesMinAmount(data[0].hyperemotes_min_amount);
      }
    };
    fetchStreamerSettings();
  }, []);

  const handleVoiceRecorded = (hasRecording: boolean, duration: number) => {
    setHasVoiceRecording(hasRecording);
    setVoiceDuration(duration);
  };

  const handleDonationTypeChange = (type: 'message' | 'voice' | 'hyperemote') => {
    setDonationType(type);
    
    if (type === 'hyperemote') {
      setFormData(prev => ({ ...prev, amount: '4' }));
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
    
    // Validate minimum amounts based on donation type
    const amount = parseFloat(formData.amount);
    if (donationType === 'message' && amount < 1) {
      toast({
        title: "Insufficient Amount",
        description: "Text messages require a minimum donation of ₹1. TTS available from ₹2+.",
        variant: "destructive",
      });
      return;
    }
    if (donationType === 'voice' && amount < 3) {
      toast({
        title: "Insufficient Amount",
        description: "Voice messages require a minimum donation of ₹3 (3 seconds).",
        variant: "destructive",
      });
      return;
    }
    
    setShowPhoneDialog(true);
  };

  const handlePaymentWithPhone = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }

    setIsSubmitting(true);

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

      const { data, error } = await supabase.functions.invoke('create-payment-order-streamer23', {
        body: {
          name: formData.name,
          amount: amount,
          message: donationType === 'message' ? formData.message : 
                  donationType === 'voice' ? 'Sent a Voice message' : 
                  donationType === 'hyperemote' ? formData.message : '',
          voiceBlob: voiceDataBase64,
          phone: phoneNumber,
        },
      });

      if (error) throw error;

      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        returnUrl: `${window.location.origin}/streamer23`,
      };

      if (cashfree) {
        setShowPhoneDialog(false);
        cashfree.checkout(checkoutOptions);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const characterLimit = getCharacterLimit(currentAmount);
  const voiceDurationLimit = getVoiceDuration(currentAmount);

  const isHyperemote = hyperemotesEnabled && currentAmount >= hyperemotesMinAmount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto bg-card/95 backdrop-blur-sm border-rose-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 via-rose-600/20 to-rose-400/20 opacity-50 blur-xl"></div>
          <CardHeader className="text-center relative z-10">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center space-x-2 text-rose-500">
                <Star className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-rose-600 bg-clip-text text-transparent">
              Streamer 23
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Support Streamer 23 with your donation
            </p>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <DonationTypeSelector
                donationType={donationType}
                onTypeChange={handleDonationTypeChange}
                hyperemotesMinAmount={hyperemotesMinAmount}
                brandColor="#f43f5e"
              />

              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-semibold">Your Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  maxLength={50}
                  className="border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                  placeholder="Enter your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-base font-semibold">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  required
                  className="border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                  placeholder="Enter amount"
                />
                {isHyperemote && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg">
                    <Star className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
                      Hyperemote activated! Your message will be auto-approved!
                    </p>
                  </div>
                )}
              </div>

              {donationType === 'message' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="message" className="text-base font-semibold">Message</Label>
                    <span className="text-xs text-muted-foreground">
                      {formData.message.length}/{characterLimit}
                    </span>
                  </div>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    maxLength={characterLimit}
                    rows={4}
                    className="border-rose-200 focus:border-rose-400 focus:ring-rose-400 resize-none"
                    placeholder="Type your message here..."
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 Donate ₹100+ for 200 chars, ₹200+ for 250 chars
                  </p>
                </div>
              )}

              {donationType === 'voice' && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Voice Message</Label>
                  <VoiceRecorder
                    onRecordingComplete={handleVoiceRecorded}
                    maxDurationSeconds={voiceDurationLimit}
                    requiredAmount={150}
                    currentAmount={currentAmount}
                    controller={voiceRecorder}
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 ₹150+ for 15s, ₹200+ for 20s, ₹250+ for 30s
                  </p>
                </div>
              )}

              {donationType === 'hyperemote' && (
                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-300 dark:border-rose-700 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Star className="w-6 h-6 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-rose-900 dark:text-rose-100 mb-2">
                        Hyperemote - Premium Support
                      </h3>
                      <p className="text-sm text-rose-700 dark:text-rose-300 mb-3">
                        Show extra support with a hyperemote! Minimum ₹{hyperemotesMinAmount} required.
                        Your message will be auto-approved and highlighted.
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="hyperemote-message" className="text-sm font-medium">Your Message</Label>
                        <Textarea
                          id="hyperemote-message"
                          value={formData.message}
                          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                          maxLength={characterLimit}
                          rows={3}
                          className="border-rose-300 focus:border-rose-500 focus:ring-rose-500"
                          placeholder="Your hyperemote message..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Processing...
                  </span>
                ) : (
                  'Donate Now'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

      <EnhancedPhoneDialog
        open={showPhoneDialog}
        onOpenChange={setShowPhoneDialog}
        phoneNumber={phoneNumber}
        onPhoneChange={setPhoneNumber}
        phoneError={phoneError}
        onContinue={handlePaymentWithPhone}
        isSubmitting={isSubmitting}
        brandColor="#f43f5e"
      />
    </div>
  );
};

export default Streamer23;
