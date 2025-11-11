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
import looteriyaCardBg from '@/assets/looteriya-card-bg.jpg';
import looteriyaMainBanner from '@/assets/looteriya-main-banner.jpg';

const LooteriyaGaming = () => {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    message: '',
  });
  const [donationType, setDonationType] = useState<'text' | 'voice' | 'hyperemote'>('text');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [cashfree, setCashfree] = useState<any>(null);
  const [sdkLoading, setSdkLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);
  const [streamerSettings, setStreamerSettings] = useState<{ hyperemotes_enabled: boolean; hyperemotes_min_amount: number } | null>(null);
  const navigate = useNavigate();
  const voiceRecorder = useVoiceRecorder(120);

  useEffect(() => {
    const initializeCashfree = async () => {
      try {
        setSdkLoading(true);
        const cashfreeInstance = await load({ mode: 'production' });
        setCashfree(cashfreeInstance);
        toast.success('Payment system ready');
      } catch (error) {
        console.error('Failed to initialize Cashfree:', error);
        toast.error('Payment system initialization failed');
      } finally {
        setSdkLoading(false);
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
      className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat"
      style={{ 
        backgroundImage: `url(${looteriyaMainBanner})`
      }}
    >
      {/* Dark overlay for better card visibility */}
      <div className="absolute inset-0 bg-black/20"></div>

      <Card 
        className="w-full max-w-md mx-auto bg-card/95 backdrop-blur-sm border-amber-500/20 shadow-2xl relative overflow-hidden"
        style={{ 
          backgroundImage: `url(${looteriyaCardBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/70"></div>
        
        {/* Card glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-amber-600/20 to-amber-400/20 opacity-50 blur-xl"></div>
        
        <CardHeader className="text-center relative z-10">
          <div className="flex justify-center mb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-amber-500 shadow-xl">
              <img src={looteriyaLogo} alt="Looteriya Gaming Logo" className="w-full h-full object-cover" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
            Looteriya Gaming
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Support Looteriya Gaming with your donation
          </p>
        </CardHeader>

        <CardContent className="space-y-6 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-amber-500">
                Your Name *
              </label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleInputChange}
                className="border-amber-500/30 focus:border-amber-500 focus:ring-amber-500/20"
                required
              />
            </div>

            {/* Donation Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-amber-500">
                Choose your donation type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleDonationTypeChange('text')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    donationType === 'text'
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-amber-500/30 hover:border-amber-500/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-base mb-1">💬</div>
                    <div className="font-medium text-xs">Text Message</div>
                    <div className="text-xs text-muted-foreground">Min: ₹1</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDonationTypeChange('voice')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    donationType === 'voice'
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-amber-500/30 hover:border-amber-500/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-base mb-1">🎤</div>
                    <div className="font-medium text-xs">Voice Message</div>
                    <div className="text-xs text-muted-foreground">Min: ₹2</div>
                  </div>
                </button>
                {streamerSettings?.hyperemotes_enabled && (
                  <button
                    type="button"
                    onClick={() => handleDonationTypeChange('hyperemote')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      donationType === 'hyperemote'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-purple-500/30 hover:border-purple-500/50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-base mb-1">🎉</div>
                      <div className="font-medium text-xs">Hyperemotes</div>
                      <div className="text-xs text-muted-foreground">
                        ₹{streamerSettings?.hyperemotes_min_amount || 4}+ celebration
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Amount Field */}
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium text-amber-500">
                Amount (₹) *
              </label>
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={handleInputChange}
                className="border-amber-500/30 focus:border-amber-500 focus:ring-amber-500/20"
                required
                min="1"
                disabled={donationType === 'hyperemote'}
              />
            </div>

            {/* Message/Voice Field */}
            {donationType === 'text' && (
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-amber-500">
                  Your Message (Optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Enter your message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full min-h-[100px] px-3 py-2 rounded-md border border-amber-500/30 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 bg-background text-foreground placeholder:text-muted-foreground"
                  rows={3}
                />
              </div>
            )}

            {donationType === 'voice' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-amber-500">
                  Voice Message *
                </label>
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
              className="w-full font-semibold py-6"
              style={{ backgroundColor: '#f59e0b' }}
              disabled={isProcessingPayment || sdkLoading}
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
