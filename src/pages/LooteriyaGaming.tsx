import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { load } from '@cashfreepayments/cashfree-js';
import EnhancedVoiceRecorder from '@/components/EnhancedVoiceRecorder';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { PhoneDialog } from '@/components/PhoneDialog';
import looteriyaLogo from '@/assets/looteriya-logo.jpg';
import looteriyaProfile from '@/assets/looteriya-profile.jpg';
import looteriyaBanner from '@/assets/looteriya-banner.jpg';

const LooteriyaGaming = () => {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    message: '',
  });
  const [donationType, setDonationType] = useState<'text' | 'voice' | 'hyperemote'>('text');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [cashfree, setCashfree] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);
  const [streamerSettings, setStreamerSettings] = useState<{ hyperemotes_enabled: boolean; hyperemotes_min_amount: number } | null>(null);
  const navigate = useNavigate();
  const voiceRecorder = useVoiceRecorder(120);

  useEffect(() => {
    const initializeCashfree = async () => {
      try {
        const cashfreeInstance = await load({ mode: 'production' });
        setCashfree(cashfreeInstance);
      } catch (error) {
        console.error('Failed to initialize Cashfree:', error);
        toast.error('Payment system initialization failed');
      }
    };

    const fetchStreamerSettings = async () => {
      const { data, error } = await supabase.rpc('get_streamer_public_settings', {
        slug: 'looteriya_gaming'
      });
      
      if (!error && data && data.length > 0) {
        setStreamerSettings(data[0]);
      }
    };

    initializeCashfree();
    fetchStreamerSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (donationType === 'voice' && !voiceRecorder.audioBlob) {
      toast.error('Please record a voice message');
      return;
    }

    setIsPhoneDialogOpen(true);
  };

  const handlePaymentAfterPhone = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return;
    }

    setPhoneError('');
    setIsPhoneDialogOpen(false);
    setIsProcessingPayment(true);

    try {
      let voiceData = null;
      if (donationType === 'voice' && voiceRecorder.audioBlob) {
        const reader = new FileReader();
        voiceData = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });
      }

      const { data, error } = await supabase.functions.invoke('create-payment-order-looteriya-gaming', {
        body: {
          name: formData.name,
          amount: parseFloat(formData.amount),
          message: donationType === 'text' ? formData.message : null,
          phone: phoneNumber,
          voiceData: voiceData,
          isHyperemote: donationType === 'hyperemote',
        },
      });

      if (error) throw error;

      if (!cashfree) {
        throw new Error('Payment system not initialized');
      }

      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        returnUrl: `${window.location.origin}/looteriya_gaming?order_id=${data.order_id}`,
      };

      cashfree.checkout(checkoutOptions).then(() => {
        console.log('Payment initiated');
      });

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    return /^\d{10}$/.test(phone);
  };

  const handlePhoneSubmit = () => {
    handlePaymentAfterPhone();
  };

  const handleDonationTypeChange = (value: string) => {
    setDonationType(value as 'text' | 'voice' | 'hyperemote');
    if (value === 'hyperemote') {
      const minAmount = streamerSettings?.hyperemotes_min_amount || 50;
      setFormData(prev => ({ ...prev, amount: minAmount.toString(), message: '' }));
    } else {
      setFormData(prev => ({ ...prev, message: '' }));
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${looteriyaBanner})` }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <Card className="w-full max-w-md bg-slate-900/95 border-amber-500/20 relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-amber-500 shadow-xl">
              <img src={looteriyaLogo} alt="Looteriya Gaming Logo" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-amber-500 shadow-lg">
              <img src={looteriyaProfile} alt="Looteriya Profile" className="w-full h-full object-cover" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-transparent bg-clip-text">
            Looteriya Gaming
          </CardTitle>
          <CardDescription className="text-slate-300">
            Support Looteriya Gaming with your donation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-200">Your Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-slate-200">Donation Type *</Label>
              <RadioGroup value={donationType} onValueChange={handleDonationTypeChange}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="text" id="text" className="border-amber-500 text-amber-500" />
                  <Label htmlFor="text" className="text-slate-300 cursor-pointer">Text Message</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="voice" id="voice" className="border-amber-500 text-amber-500" />
                  <Label htmlFor="voice" className="text-slate-300 cursor-pointer">Voice Message</Label>
                </div>
                {streamerSettings?.hyperemotes_enabled && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hyperemote" id="hyperemote" className="border-amber-500 text-amber-500" />
                    <Label htmlFor="hyperemote" className="text-slate-300 cursor-pointer">
                      Hyperemote (₹{streamerSettings.hyperemotes_min_amount}+ for rain effect)
                    </Label>
                  </div>
                )}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-slate-200">Amount (₹) *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={handleInputChange}
                required
                min="1"
                disabled={donationType === 'hyperemote'}
                className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            {donationType === 'text' && (
              <div className="space-y-2">
                <Label htmlFor="message" className="text-slate-200">Message (Optional)</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Enter your message (optional)"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={3}
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                />
              </div>
            )}

            {donationType === 'voice' && (
              <div className="space-y-2">
                <Label className="text-slate-200">Voice Message *</Label>
                <EnhancedVoiceRecorder
                  onRecordingComplete={(blob) => {}}
                  controller={voiceRecorder}
                  requiredAmount={2}
                  currentAmount={parseFloat(formData.amount) || 0}
                  brandColor="#f59e0b"
                />
              </div>
            )}

            <Button 
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold"
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? 'Processing...' : 'Continue to Payment'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <PhoneDialog
        open={isPhoneDialogOpen}
        onOpenChange={setIsPhoneDialogOpen}
        phoneNumber={phoneNumber}
        onPhoneChange={setPhoneNumber}
        phoneError={phoneError}
        onContinue={handlePhoneSubmit}
        isSubmitting={isProcessingPayment}
        buttonColor="#f59e0b"
      />
    </div>
  );
};

export default LooteriyaGaming;
