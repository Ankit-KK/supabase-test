import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { load } from '@cashfreepayments/cashfree-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Music, Gift, Volume2 } from 'lucide-react';
import SimpleVoiceRecorder from '@/components/SimpleVoiceRecorder';
import SimpleEmojiSelector from '@/components/SimpleEmojiSelector';

const ApexLegend = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [cashfree, setCashfree] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    message: '',
    phone: '',
  });
  const [voiceData, setVoiceData] = useState<string | null>(null);
  const [isHyperemote, setIsHyperemote] = useState(false);
  const [isAmountLocked, setIsAmountLocked] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  const getVoiceDuration = (amount: number): number => {
    if (amount >= 250) return 30;
    if (amount >= 200) return 20;
    if (amount >= 150) return 15;
    return 0;
  };

  const getCharacterLimit = (amount: number): number => {
    if (amount >= 200) return 250;
    if (amount >= 100) return 200;
    if (amount >= 40) return 100;
    return 100;
  };

  useEffect(() => {
    const initCashfree = async () => {
      try {
        const cf = await load({ mode: 'production' });
        setCashfree(cf);
      } catch (error) {
        console.error('Failed to load Cashfree SDK:', error);
        toast.error('Payment system initialization failed');
      }
    };
    initCashfree();
  }, []);

  useEffect(() => {
    const orderId = searchParams.get('order_id');
    const status = searchParams.get('status');

    if (orderId && status) {
      if (status === 'PAID') {
        setProcessingPayment(true);
        const uploadVoice = async () => {
          try {
            const { error } = await supabase.functions.invoke('upload-voice-message-apexlegend', {
              body: { order_id: orderId }
            });
            if (error) console.error('Voice upload error:', error);
          } catch (error) {
            console.error('Voice upload exception:', error);
          } finally {
            setProcessingPayment(false);
            toast.success('Payment successful! Your donation is being processed.');
            setTimeout(() => navigate('/apexlegend', { replace: true }), 3000);
          }
        };
        uploadVoice();
      } else {
        toast.error('Payment was not completed');
        navigate('/apexlegend', { replace: true });
      }
    }
  }, [searchParams, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'amount') {
      if (isAmountLocked) {
        toast.error('Cannot change amount while recording voice message');
        return;
      }
      setFormData(prev => ({ ...prev, [name]: value }));
      
      const currentAmount = parseFloat(value) || 0;
      const charLimit = getCharacterLimit(currentAmount);
      if (formData.message.length > charLimit) {
        setFormData(prev => ({ ...prev, message: prev.message.substring(0, charLimit) }));
      }
    } else if (name === 'message') {
      const currentAmount = parseFloat(formData.amount) || 0;
      const charLimit = getCharacterLimit(currentAmount);
      if (value.length <= charLimit) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.amount || !formData.phone.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount < 40) {
      toast.error('Minimum donation amount is ₹40');
      return;
    }

    if (amount > 100000) {
      toast.error('Maximum donation amount is ₹1,00,000');
      return;
    }

    if (isHyperemote && amount < 50) {
      toast.error('Hyperemote requires minimum ₹50');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment-order-apexlegend', {
        body: {
          name: formData.name.trim(),
          amount: amount,
          message: formData.message.trim() || null,
          phone: formData.phone.trim(),
          voiceData: voiceData,
          isHyperemote: isHyperemote
        }
      });

      if (error) throw error;

      if (!data.success || !data.payment_session_id) {
        throw new Error('Failed to create payment order');
      }

      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        returnUrl: `${window.location.origin}/apexlegend?order_id=${data.order_id}&status={order_status}`,
      };

      if (cashfree) {
        await cashfree.checkout(checkoutOptions);
      } else {
        throw new Error('Payment system not initialized');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to process donation');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceRecorded = async (blob: Blob | null) => {
    if (blob) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setVoiceData(base64String.split(',')[1]);
      };
      reader.readAsDataURL(blob);
    } else {
      setVoiceData(null);
    }
  };

  const currentAmount = parseFloat(formData.amount) || 0;
  const charLimit = getCharacterLimit(currentAmount);
  const voiceDuration = getVoiceDuration(currentAmount);
  const canRecordVoice = currentAmount >= 150;

  if (processingPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e74c3c]/10 to-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#e74c3c]" />
          <h2 className="text-2xl font-bold">Processing Payment...</h2>
          <p className="text-muted-foreground">Please wait while we confirm your donation</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e74c3c]/10 to-background py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#e74c3c]/10 mb-4">
            <Music className="w-10 h-10 text-[#e74c3c]" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#e74c3c] to-[#c0392b] bg-clip-text text-transparent">
            Support ApexLegend
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Your donation helps keep the legends alive! Add a message or voice note to show your support.
          </p>
        </div>

        <Card className="p-8 space-y-6 border-[#e74c3c]/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-semibold">Your Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your name"
                required
                maxLength={100}
                className="text-base border-[#e74c3c]/20 focus:border-[#e74c3c]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-base font-semibold">Phone Number *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                required
                pattern="[0-9]{10}"
                maxLength={10}
                className="text-base border-[#e74c3c]/20 focus:border-[#e74c3c]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-base font-semibold">
                Amount (₹) *
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  Min: ₹40 | Max: ₹1,00,000
                </span>
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Enter amount"
                required
                min="40"
                max="100000"
                step="1"
                disabled={isAmountLocked}
                className="text-base border-[#e74c3c]/20 focus:border-[#e74c3c]"
              />
              {isAmountLocked && (
                <p className="text-sm text-amber-600 flex items-center gap-1">
                  <Volume2 className="w-4 h-4" />
                  Amount locked during voice recording
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-base font-semibold">
                Message (Optional)
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {formData.message.length}/{charLimit} characters
                  {currentAmount >= 40 && currentAmount < 100 && ' (₹40-99: 100 chars)'}
                  {currentAmount >= 100 && currentAmount < 200 && ' (₹100-199: 200 chars)'}
                  {currentAmount >= 200 && ' (₹200+: 250 chars)'}
                </span>
              </Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Add a message to show your support..."
                rows={4}
                maxLength={charLimit}
                className="text-base resize-none border-[#e74c3c]/20 focus:border-[#e74c3c]"
              />
              <SimpleEmojiSelector onEmojiSelect={(emoji) => {
                setSelectedEmoji(emoji);
                setFormData(prev => ({ ...prev, message: prev.message + emoji }));
              }} />
            </div>

            <SimpleVoiceRecorder onVoiceRecorded={handleVoiceRecorded} />

            <div className="flex items-center gap-3 p-4 bg-[#e74c3c]/5 rounded-lg border border-[#e74c3c]/20">
              <input
                type="checkbox"
                id="hyperemote"
                checked={isHyperemote}
                onChange={(e) => setIsHyperemote(e.target.checked)}
                disabled={currentAmount < 50}
                className="w-5 h-5 rounded border-[#e74c3c]/40 text-[#e74c3c] focus:ring-[#e74c3c] disabled:opacity-50"
              />
              <Label htmlFor="hyperemote" className="cursor-pointer flex-1">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-[#e74c3c]" />
                  <span className="font-semibold">Enable Hyperemote</span>
                  <span className="text-sm text-muted-foreground">(Min ₹50)</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Make your donation stand out with special effects!
                </p>
              </Label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full text-lg h-12 bg-[#e74c3c] hover:bg-[#c0392b] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                `Donate ₹${formData.amount || '0'}`
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ApexLegend;
