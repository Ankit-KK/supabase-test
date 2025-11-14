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
import { Gamepad2 } from 'lucide-react';

const DamaskPlays = () => {
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
  
  // Calculate voice duration based on amount
  const getVoiceDuration = (amount: number) => {
    if (amount >= 500) return 30;
    if (amount >= 250) return 25;
    if (amount >= 150) return 15;
    return 15; // default
  };

  const currentAmount = parseFloat(formData.amount) || 0;
  const voiceRecorder = useVoiceRecorder(getVoiceDuration(currentAmount));

  useEffect(() => {
    const initializeCashfree = async () => {
      try {
        setSdkLoading(true);
        const cashfreeInstance = await load({ mode: 'production' });
        setCashfree(cashfreeInstance);
      } catch (error) {
        console.error('Failed to load Cashfree SDK:', error);
        toast.error('Failed to initialize payment system');
      } finally {
        setSdkLoading(false);
      }
    };

    initializeCashfree();
  }, []);

  useEffect(() => {
    const fetchStreamerSettings = async () => {
      try {
        const { data, error } = await supabase.rpc('get_streamer_public_settings', {
          slug: 'damask_plays'
        });
        
        if (error) {
          console.error('Error fetching streamer settings:', error);
          return;
        }

        if (data && data.length > 0) {
          setStreamerSettings(data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch streamer settings:', err);
      }
    };

    fetchStreamerSettings();
  }, []);

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amountNum = parseFloat(formData.amount);
    
    // Validate amounts based on donation type
    if (donationType === 'hyperemote') {
      const minAmount = streamerSettings?.hyperemotes_min_amount || 50;
      if (amountNum < minAmount) {
        toast.error(`Minimum amount for hyperemotes is ₹${minAmount}`);
        return;
      }
    } else if (donationType === 'voice') {
      if (amountNum < 150) {
        toast.error('Minimum amount for voice messages is ₹150');
        return;
      }
      if (!voiceRecorder.audioBlob) {
        toast.error('Please record a voice message');
        return;
      }
    } else if (donationType === 'text') {
      if (amountNum < 40) {
        toast.error('Minimum amount for text messages is ₹40');
        return;
      }
      if (!formData.message || formData.message.trim().length === 0) {
        toast.error('Please enter a message');
        return;
      }
    }
    
    setPhoneError('');
    setIsPhoneDialogOpen(true);
  };

  const handlePaymentWithPhone = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setPhoneError('Please enter a valid 10-digit mobile number starting with 6-9');
      return;
    }

    setIsProcessingPayment(true);
    setIsPhoneDialogOpen(false);

    try {
      let voiceMessageUrl = null;

      if (donationType === 'voice' && voiceRecorder.audioBlob) {
        const reader = new FileReader();
        const voiceDataBase64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(voiceRecorder.audioBlob);
        });

        const { data: uploadResult, error: uploadError } = await supabase.functions.invoke(
          'upload-voice-message-direct',
          {
            body: { 
              voiceData: voiceDataBase64, 
              streamerSlug: 'damask_plays'
            }
          }
        );

        if (uploadError) {
          console.error('Voice upload error:', uploadError);
          throw new Error('Failed to upload voice message');
        }

        voiceMessageUrl = uploadResult.voice_message_url;
        console.log('Voice message uploaded successfully:', voiceMessageUrl);
      }

      const { data, error } = await supabase.functions.invoke('create-payment-order-damask-plays', {
        body: {
          name: formData.name,
          amount: parseFloat(formData.amount),
          message: donationType === 'text' ? formData.message : null,
          phone: phoneNumber,
          voiceMessageUrl: voiceMessageUrl,
          isHyperemote: donationType === 'hyperemote',
        },
      });

      if (error) throw error;

      if (!data?.payment_session_id) {
        throw new Error('No payment session ID received');
      }

      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        returnUrl: `${window.location.origin}/damask_plays?order_id=${data.order_id}&status={order_status}`,
      };

      if (cashfree) {
        cashfree.checkout(checkoutOptions);
      } else {
        throw new Error('Payment system not initialized');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to process payment');
      setIsProcessingPayment(false);
    }
  };

  const getCharacterLimit = () => {
    const amount = parseFloat(formData.amount) || 0;
    if (amount >= 250) return 500;
    if (amount >= 100) return 250;
    if (amount >= 70) return 150;
    return 100;
  };

  const currentCharLimit = getCharacterLimit();
  const currentMessageLength = formData.message.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-800 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-full bg-emerald-500/20 flex items-center justify-center border-4 border-emerald-500">
              <Gamepad2 className="w-16 h-16 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white">Damask plays</h1>
          <p className="text-emerald-300 text-lg">Support with a donation</p>
        </div>

        {/* Donation Card */}
        <Card className="bg-slate-800/50 border-emerald-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Make a Donation</CardTitle>
            <CardDescription className="text-emerald-300">
              Choose your donation type and amount
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Donation Type Selection */}
              <div className="space-y-3">
                <Label className="text-white text-lg">Donation Type</Label>
                <RadioGroup
                  value={donationType}
                  onValueChange={(value: 'text' | 'voice' | 'hyperemote') => setDonationType(value)}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text" id="text" className="border-emerald-500" />
                    <Label htmlFor="text" className="text-white cursor-pointer flex-1">
                      Text Message (₹40+)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="voice" id="voice" className="border-emerald-500" />
                    <Label htmlFor="voice" className="text-white cursor-pointer flex-1">
                      Voice Message (₹150+)
                    </Label>
                  </div>
                  {streamerSettings?.hyperemotes_enabled && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hyperemote" id="hyperemote" className="border-emerald-500" />
                      <Label htmlFor="hyperemote" className="text-white cursor-pointer flex-1">
                        Hyperemote (₹{streamerSettings.hyperemotes_min_amount}+)
                      </Label>
                    </div>
                  )}
                </RadioGroup>
              </div>

              {/* Name Input */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  maxLength={50}
                  required
                  className="bg-slate-700/50 border-emerald-500/50 text-white placeholder:text-slate-400"
                />
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-white">
                  Amount (₹)
                  {donationType === 'text' && ' - Minimum ₹40'}
                  {donationType === 'voice' && ' - Minimum ₹150 (15s-30s based on amount)'}
                  {donationType === 'hyperemote' && ` - Minimum ₹${streamerSettings?.hyperemotes_min_amount || 50}`}
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  min={donationType === 'hyperemote' ? streamerSettings?.hyperemotes_min_amount || 50 : donationType === 'voice' ? 150 : 40}
                  required
                  className="bg-slate-700/50 border-emerald-500/50 text-white placeholder:text-slate-400"
                />
              </div>

              {/* Text Message */}
              {donationType === 'text' && (
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-white">
                    Your Message ({currentMessageLength}/{currentCharLimit})
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your message..."
                    value={formData.message}
                    onChange={(e) => {
                      if (e.target.value.length <= currentCharLimit) {
                        setFormData({ ...formData, message: e.target.value });
                      }
                    }}
                    rows={4}
                    maxLength={currentCharLimit}
                    required
                    className="bg-slate-700/50 border-emerald-500/50 text-white placeholder:text-slate-400 resize-none"
                  />
                  <p className="text-xs text-emerald-300">
                    {parseFloat(formData.amount) >= 70 
                      ? '✓ TTS will be generated for your message'
                      : '⚠️ ₹70+ required for TTS generation'}
                  </p>
                </div>
              )}

              {/* Voice Recorder */}
              {donationType === 'voice' && (
                <div className="space-y-2">
                  <Label className="text-white">Voice Message</Label>
                  <EnhancedVoiceRecorder
                    onRecordingComplete={() => {}}
                    maxDurationSeconds={getVoiceDuration(currentAmount)}
                    controller={voiceRecorder}
                    currentAmount={currentAmount}
                    requiredAmount={150}
                    brandColor="#10b981"
                  />
                  <p className="text-xs text-emerald-300">
                    Duration: {currentAmount >= 500 ? '30s' : currentAmount >= 250 ? '25s' : '15s'} based on amount
                  </p>
                </div>
              )}

              {/* Hyperemote Info */}
              {donationType === 'hyperemote' && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                  <p className="text-emerald-300 text-sm">
                    ✨ Your hyperemote will trigger special visual effects on stream!
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={sdkLoading || isProcessingPayment}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-lg"
              >
                {sdkLoading ? 'Loading...' : isProcessingPayment ? 'Processing...' : 'Proceed to Payment'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Phone Dialog */}
        <PhoneDialog
          open={isPhoneDialogOpen}
          onOpenChange={setIsPhoneDialogOpen}
          phoneNumber={phoneNumber}
          onPhoneChange={(phone) => {
            setPhoneNumber(phone);
            setPhoneError('');
          }}
          phoneError={phoneError}
          onContinue={handlePaymentWithPhone}
          isSubmitting={isProcessingPayment}
          buttonColor="#10b981"
        />
      </div>
    </div>
  );
};

export default DamaskPlays;
