import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { load } from '@cashfreepayments/cashfree-js';
import EnhancedVoiceRecorder from '@/components/EnhancedVoiceRecorder';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { PhoneDialog } from '@/components/PhoneDialog';
import { Zap } from 'lucide-react';

// Note: Replace these with actual ThunderX assets when available
// For now, we'll use a placeholder gradient background
const thunderxBanner = '/lovable-uploads/thunderx-banner.jpg'; // User will need to upload
const thunderxCardBg = '/lovable-uploads/thunderx-card-bg.jpg'; // User will need to upload
const thunderxLogo = '/lovable-uploads/thunderx-logo.jpg'; // User will need to upload

const ThunderX = () => {
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

  const getVoiceDuration = (amount: number) => {
    if (amount >= 500) return 30;
    if (amount >= 250) return 25;
    if (amount >= 150) return 15;
    return 15;
  };

  const currentAmount = parseFloat(formData.amount) || 0;
  const voiceRecorder = useVoiceRecorder(getVoiceDuration(currentAmount));

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
        slug: 'thunderx'
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

    if (donationType === 'text' && amount < 40) {
      toast.error('Minimum amount for text message is ₹40');
      return;
    }
    if (donationType === 'voice' && amount < 150) {
      toast.error('Minimum amount for voice message is ₹150');
      return;
    }
    if (donationType === 'hyperemote' && amount < 50) {
      toast.error('Minimum amount for hyperemotes is ₹50');
      return;
    }

    if (donationType === 'text' && !formData.message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (donationType === 'voice' && !voiceRecorder.audioBlob) {
      toast.error('Please record a voice message');
      return;
    }

    setIsPhoneDialogOpen(true);
  };

  const handlePaymentWithPhone = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return;
    }
    setPhoneError('');
    setIsProcessingPayment(true);
    setIsPhoneDialogOpen(false);

    try {
      let voiceMessageUrl = null;

      if (donationType === 'voice' && voiceRecorder.audioBlob) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
        });
        reader.readAsDataURL(voiceRecorder.audioBlob);
        const base64Data = await base64Promise;

        const { data: uploadData, error: uploadError } = await supabase.functions.invoke(
          'upload-voice-message-direct',
          { body: { voiceData: base64Data.split(',')[1] } }
        );

        if (uploadError) throw uploadError;
        voiceMessageUrl = uploadData.url;
      }

      const { data, error } = await supabase.functions.invoke('create-payment-order-thunderx', {
        body: {
          name: formData.name,
          amount: formData.amount,
          message: formData.message,
          phone: phoneNumber,
          voiceMessageUrl,
          isHyperemote: donationType === 'hyperemote'
        }
      });

      if (error) throw error;

      if (!cashfree) {
        toast.error('Payment system not initialized');
        setIsProcessingPayment(false);
        return;
      }

      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_modal"
      };

      setTimeout(async () => {
        try {
          const result = await cashfree.checkout(checkoutOptions);
          if (result.error) {
            navigate(`/status?order_id=${data.order_id}&status=pending`);
          } else if (result.paymentDetails) {
            navigate(`/status?order_id=${data.order_id}&status=success`);
          } else {
            navigate(`/status?order_id=${data.order_id}&status=pending`);
          }
        } catch (checkoutError) {
          console.error('Checkout error:', checkoutError);
          navigate(`/status?order_id=${data.order_id}&status=pending`);
        } finally {
          setIsProcessingPayment(false);
        }
      }, 100);

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment. Please try again.');
      setIsProcessingPayment(false);
      setIsPhoneDialogOpen(true);
    }
  };

  const getCharacterLimit = () => {
    const amount = parseFloat(formData.amount) || 0;
    if (amount >= 200) return 250;
    if (amount >= 100) return 200;
    return 100;
  };

  const handleDonationTypeChange = (value: string) => {
    setDonationType(value as 'text' | 'voice' | 'hyperemote');
    
    if (value === 'hyperemote') {
      setFormData(prev => ({ ...prev, amount: '50', message: '' }));
    } else if (value === 'voice') {
      setFormData(prev => ({ ...prev, amount: '150', message: '' }));
    } else {
      setFormData(prev => ({ ...prev, amount: '40' }));
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{ 
        background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)',
      }}
    >
      <div className="absolute inset-0 bg-black/20"></div>

      <Card 
        className="w-full max-w-[21rem] mx-auto bg-card/95 backdrop-blur-sm border-emerald-500/20 shadow-2xl relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7))`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-emerald-600/20 to-emerald-400/20 opacity-50 blur-xl"></div>
        
        <CardHeader className="text-center relative z-10">
          <div className="flex justify-center mb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-500 shadow-xl bg-emerald-500/20 flex items-center justify-center">
              <Zap className="w-20 h-20 text-emerald-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            THUNDERX
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-2">
            Support THUNDERX with your donation ⚡
          </p>
        </CardHeader>

        <CardContent className="space-y-6 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-emerald-400">
                Your Name *
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleInputChange}
                className="border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/20 bg-background/50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-emerald-400">
                Choose your donation type
              </Label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDonationTypeChange('text')}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    donationType === 'text'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-emerald-500/30 hover:border-emerald-500/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm mb-0.5">💬</div>
                    <div className="font-medium text-[10px] text-foreground">Text Message</div>
                    <div className="text-[9px] text-muted-foreground">Min: ₹40</div>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleDonationTypeChange('voice')}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    donationType === 'voice'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-emerald-500/30 hover:border-emerald-500/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm mb-0.5">🎤</div>
                    <div className="font-medium text-[10px] text-foreground">Voice Message</div>
                    <div className="text-[9px] text-muted-foreground">Min: ₹150</div>
                  </div>
                </button>
                
                {streamerSettings?.hyperemotes_enabled && (
                  <button
                    type="button"
                    onClick={() => handleDonationTypeChange('hyperemote')}
                    className={`relative p-2 rounded-lg border-2 transition-all overflow-hidden ${
                      donationType === 'hyperemote'
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-emerald-500/30 hover:border-emerald-500/50'
                    }`}
                  >
                    <div 
                      className="absolute inset-0 opacity-10"
                      style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                    />
                    <div className="relative text-center">
                      <div className="text-base mb-0.5">⚡✨</div>
                      <div className="font-bold text-[10px] mb-0.5 text-foreground">Thunder Rain</div>
                      <div className="text-[9px] text-muted-foreground mb-1">Epic GIFs!</div>
                      <div className="text-[9px] font-medium text-emerald-400">Min: ₹50</div>
                    </div>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium text-emerald-400">
                Amount (₹) *
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={handleInputChange}
                className="border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/20 bg-background/50"
                min={donationType === 'voice' ? 150 : donationType === 'hyperemote' ? 50 : 40}
                required
              />
            </div>

            {donationType === 'text' && (
              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-medium text-emerald-400">
                  Your Message *
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Enter your message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/20 bg-background/50 min-h-[100px]"
                  maxLength={getCharacterLimit()}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.message.length}/{getCharacterLimit()} characters
                </p>
              </div>
            )}

            {donationType === 'voice' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-emerald-400">
                  Record Your Message *
                </Label>
                <EnhancedVoiceRecorder 
                  controller={voiceRecorder}
                  onRecordingComplete={(hasRecording, duration) => {
                    console.log('Recording complete:', hasRecording, duration);
                  }}
                  maxDurationSeconds={getVoiceDuration(currentAmount)}
                  brandColor="#10b981"
                />
                <p className="text-xs text-muted-foreground">
                  Duration: {getVoiceDuration(currentAmount)}s • ₹150-249: 15s • ₹250-499: 25s • ₹500+: 30s
                </p>
              </div>
            )}

            {donationType === 'hyperemote' && (
              <div className="space-y-2">
                <div className="p-4 rounded-lg border-2 border-emerald-500/30 bg-emerald-500/5">
                  <div className="text-center space-y-2">
                    <div className="text-4xl">⚡✨</div>
                    <h3 className="font-bold text-emerald-400">Thunder Rain Effect</h3>
                    <p className="text-xs text-muted-foreground">
                      Your donation will trigger an epic full-screen animated GIF celebration!
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full text-lg font-bold py-6"
              style={{ 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: '2px solid rgba(16, 185, 129, 0.3)'
              }}
              disabled={isProcessingPayment || sdkLoading}
            >
              {isProcessingPayment ? 'Processing...' : `Donate ₹${formData.amount || '0'}`}
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
        onContinue={handlePaymentWithPhone}
        isSubmitting={isProcessingPayment}
        buttonColor="#10b981"
      />
    </div>
  );
};

export default ThunderX;