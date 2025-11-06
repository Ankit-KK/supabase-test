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
import { Crown } from 'lucide-react';

const Streamer35 = () => {
  const { toast } = useToast();
  const [cashfree, setCashfree] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', amount: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hyperemotesEnabled, setHyperemotesEnabled] = useState(false);
  const [hyperemotesMinAmount, setHyperemotesMinAmount] = useState(50);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [donationType, setDonationType] = useState<'message' | 'voice' | 'hyperemote'>('message');
  
  const { getCharacterLimit, getVoiceDuration } = useDonationLimits();
  const voiceRecorder = useVoiceRecorder(getVoiceDuration(parseFloat(formData.amount) || 0));

  const brandColor = '#a855f7';

  useEffect(() => {
    const initializeCashfree = async () => {
      const cf = await load({ mode: 'production' });
      setCashfree(cf);
    };
    initializeCashfree();

    const fetchStreamerSettings = async () => {
      const { data } = await supabase.rpc('get_streamer_public_settings', { slug: 'streamer35' });
      if (data?.[0]) {
        setHyperemotesEnabled(data[0].hyperemotes_enabled);
        setHyperemotesMinAmount(data[0].hyperemotes_min_amount);
      }
    };
    fetchStreamerSettings();
  }, []);

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
    
    if (donationType === 'voice' && !voiceRecorder.audioBlob) {
      toast({
        title: 'Voice recording required',
        description: 'Please record a voice message for voice donations',
        variant: 'destructive',
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
      let voiceBlobData = null;
      if (donationType === 'voice' && voiceRecorder.audioBlob) {
        const reader = new FileReader();
        voiceBlobData = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });
      }

      const { data, error } = await supabase.functions.invoke('create-payment-order-streamer35', {
        body: {
          name: formData.name,
          amount: parseFloat(formData.amount),
          message: donationType === 'message' ? formData.message : null,
          voiceBlob: voiceBlobData,
          phone: phoneNumber,
        },
      });

      if (error) throw error;

      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        returnUrl: `${window.location.origin}/streamer35`,
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

  const currentAmount = parseFloat(formData.amount) || 0;
  const isHyperemote = hyperemotesEnabled && currentAmount >= hyperemotesMinAmount;
  const characterLimit = getCharacterLimit(currentAmount);
  const voiceDuration = getVoiceDuration(currentAmount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-fuchsia-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="container mx-auto max-w-2xl py-8">
        <Card className="border-purple-200 dark:border-purple-800 shadow-xl">
          <CardHeader className="text-center space-y-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="w-8 h-8" style={{ color: brandColor }} />
            </div>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Support Streamer 35
            </CardTitle>
            <CardDescription className="text-lg">Send a message with your donation</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <DonationTypeSelector
                donationType={donationType}
                onTypeChange={setDonationType}
                hyperemotesMinAmount={hyperemotesMinAmount}
                brandColor={brandColor}
              />

              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-semibold">Your Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  maxLength={50}
                  className="h-12 text-lg border-2 focus:border-purple-500"
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
                  className="h-12 text-lg border-2 focus:border-purple-500"
                  placeholder="Enter amount"
                />
                {isHyperemote && (
                  <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border-2 border-purple-300 dark:border-purple-700">
                    <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                      Hyperemote! Your message will be auto-approved!
                    </p>
                  </div>
                )}
              </div>

              {donationType === 'message' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="message" className="text-base font-semibold">Message</Label>
                    <span className="text-sm text-muted-foreground">
                      {formData.message.length}/{characterLimit}
                    </span>
                  </div>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => {
                      if (e.target.value.length <= characterLimit) {
                        setFormData(prev => ({ ...prev, message: e.target.value }));
                      }
                    }}
                    maxLength={characterLimit}
                    rows={4}
                    className="text-base border-2 focus:border-purple-500 resize-none"
                    placeholder="Your message here..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Character limit increases with donation amount
                  </p>
                </div>
              )}

              {donationType === 'voice' && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Voice Message</Label>
                  <VoiceRecorder
                    onRecordingComplete={(blob) => {}}
                    controller={voiceRecorder}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recording duration: {voiceDuration}s (increases with donation amount)
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                disabled={isSubmitting}
                style={{ backgroundColor: brandColor }}
              >
                {isSubmitting ? 'Processing...' : `Donate ₹${formData.amount || '0'}`}
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
        brandColor={brandColor}
      />
    </div>
  );
};

export default Streamer35;
