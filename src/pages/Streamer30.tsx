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
import { Diamond } from 'lucide-react';

const Streamer30 = () => {
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
      const { data } = await supabase.rpc('get_streamer_public_settings', { slug: 'streamer30' });
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

      const { data, error } = await supabase.functions.invoke('create-payment-order-streamer30', {
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
        returnUrl: `${window.location.origin}/streamer30`,
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="container mx-auto max-w-2xl py-8">
        <Card className="border-red-200 dark:border-red-800 shadow-xl">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="flex justify-center">
              <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
                <Diamond className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
              Support Streamer 30
            </CardTitle>
            <CardDescription className="text-lg">Send a message, voice note, or hyperemote with your donation</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <DonationTypeSelector
                donationType={donationType}
                onTypeChange={setDonationType}
                hyperemotesMinAmount={hyperemotesMinAmount}
                brandColor="#ef4444"
              />

              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-semibold">Your Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  maxLength={50}
                  className="border-red-200 focus:border-red-400 focus:ring-red-400"
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
                  className="border-red-200 focus:border-red-400 focus:ring-red-400"
                  placeholder="Enter amount"
                />
                {isHyperemote && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <Diamond className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">
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
                    className="border-red-200 focus:border-red-400 focus:ring-red-400 resize-none"
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
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Diamond className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                        Hyperemote - Premium Support
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-3">
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
                          className="border-red-300 focus:border-red-500 focus:ring-red-500"
                          placeholder="Your hyperemote message..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
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
      </div>

      <EnhancedPhoneDialog
        open={showPhoneDialog}
        onOpenChange={setShowPhoneDialog}
        phoneNumber={phoneNumber}
        onPhoneChange={setPhoneNumber}
        phoneError={phoneError}
        onContinue={handlePaymentWithPhone}
        isSubmitting={isSubmitting}
        brandColor="#ef4444"
      />
    </div>
  );
};

export default Streamer30;
