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

const Streamer17 = () => {
  const { toast } = useToast();
  const [cashfree, setCashfree] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', amount: '', message: '', emoji: '' });
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hyperemotesEnabled, setHyperemotesEnabled] = useState(false);
  const [hyperemotesMinAmount, setHyperemotesMinAmount] = useState(50);

  useEffect(() => {
    const initializeCashfree = async () => {
      const cf = await load({ mode: 'production' });
      setCashfree(cf);
    };
    initializeCashfree();

    const fetchStreamerSettings = async () => {
      const { data } = await supabase.rpc('get_streamer_public_settings', { slug: 'streamer17' });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment-order-streamer17', {
        body: {
          name: formData.name,
          amount: parseFloat(formData.amount),
          message: formData.message,
          voiceBlob: voiceBlob,
          emoji: formData.emoji,
        },
      });

      if (error) throw error;

      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        returnUrl: `${window.location.origin}/streamer17`,
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="container mx-auto max-w-2xl py-8">
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold" style={{ color: '#f59e0b' }}>
              Support Streamer 17
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
                  <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
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
                style={{ backgroundColor: '#f59e0b' }}
              >
                {isSubmitting ? 'Processing...' : 'Donate Now'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Streamer17;
