import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { load } from '@cashfreepayments/cashfree-js';
import SimpleVoiceRecorder from '@/components/SimpleVoiceRecorder';
import SimpleEmojiSelector from '@/components/SimpleEmojiSelector';
import { PhoneDialog } from '@/components/PhoneDialog';

const Streamer19 = () => {
  const { toast } = useToast();
  const [cashfree, setCashfree] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', amount: '', message: '', emoji: '' });
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hyperemotesEnabled, setHyperemotesEnabled] = useState(false);
  const [hyperemotesMinAmount, setHyperemotesMinAmount] = useState(50);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    const initializeCashfree = async () => {
      const cf = await load({ mode: 'production' });
      setCashfree(cf);
    };
    initializeCashfree();

    const fetchStreamerSettings = async () => {
      const { data } = await supabase.rpc('get_streamer_public_settings', { slug: 'streamer19' });
      if (data?.[0]) {
        setHyperemotesEnabled(data[0].hyperemotes_enabled);
        setHyperemotesMinAmount(data[0].hyperemotes_min_amount);
      }
    };
    fetchStreamerSettings();
  }, []);

  const handleVoiceRecorded = (blob: Blob | null) => {
    setVoiceBlob(blob);
  };

  const handleEmojiSelect = (emoji: string) => {
    setFormData(prev => ({ ...prev, emoji }));
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    setPhoneError('');
    setShowPhoneDialog(true);
  };

  const handlePaymentWithPhone = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setPhoneError('Please enter a valid 10-digit mobile number starting with 6-9');
      return;
    }

    setIsSubmitting(true);
    setShowPhoneDialog(false);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment-order-streamer19', {
        body: {
          name: formData.name,
          amount: parseFloat(formData.amount),
          message: formData.message,
          voiceBlob: voiceBlob,
          emoji: formData.emoji,
          phone: phoneNumber,
        },
      });

      if (error) throw error;

      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        returnUrl: `${window.location.origin}/streamer19`,
      };

      if (cashfree) {
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

  const isHyperemote = hyperemotesEnabled && parseFloat(formData.amount) >= hyperemotesMinAmount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="container mx-auto max-w-2xl py-8">
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold" style={{ color: '#8b5cf6' }}>
              Support Streamer 19
            </CardTitle>
            <CardDescription>Send a message with your donation</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  maxLength={50}
                />
              </div>

              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
                {isHyperemote && (
                  <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                    🎉 Hyperemote! Your message will be auto-approved!
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  maxLength={200}
                  rows={3}
                />
              </div>

              <SimpleEmojiSelector onEmojiSelect={handleEmojiSelect} />
              <SimpleVoiceRecorder onVoiceRecorded={handleVoiceRecorded} />

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
                style={{ backgroundColor: '#8b5cf6' }}
              >
                {isSubmitting ? 'Processing...' : 'Donate Now'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <PhoneDialog
          open={showPhoneDialog}
          onOpenChange={setShowPhoneDialog}
          phoneNumber={phoneNumber}
          onPhoneChange={(phone) => {
            setPhoneNumber(phone);
            setPhoneError('');
          }}
          phoneError={phoneError}
          onContinue={handlePaymentWithPhone}
          isSubmitting={isSubmitting}
          buttonColor="#8b5cf6"
        />
      </div>
    </div>
  );
};

export default Streamer19;
