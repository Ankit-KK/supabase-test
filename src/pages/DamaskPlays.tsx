import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import damaskBanner from '@/assets/damask-banner.jpg';
import damaskProfile from '@/assets/damask-profile.jpg';
import damaskLogo from '@/assets/damask-logo.jpg';

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
  const [availableGifs, setAvailableGifs] = useState<{ name: string; url: string }[]>([]);
  const [selectedGif, setSelectedGif] = useState<string>('');
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

  // Fetch available GIFs for hyperemote selection
  useEffect(() => {
    const fetchGifs = async () => {
      try {
        const { data, error } = await supabase.storage
          .from('damask-gif')
          .list();

        if (error) {
          console.error('Error fetching GIFs:', error);
          return;
        }

        if (data) {
          const gifs = data
            .filter(file => file.name.endsWith('.gif'))
            .map(file => ({
              name: file.name,
              url: supabase.storage.from('damask-gif').getPublicUrl(file.name).data.publicUrl
            }));
          setAvailableGifs(gifs);
          if (gifs.length > 0) {
            setSelectedGif(gifs[0].name); // Default to first GIF
          }
        }
      } catch (err) {
        console.error('Failed to fetch GIFs:', err);
      }
    };

    if (donationType === 'hyperemote') {
      fetchGifs();
    }
  }, [donationType]);

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
    
    if (donationType === 'hyperemote') {
      const minAmount = streamerSettings?.hyperemotes_min_amount || 50;
      if (amountNum < minAmount) {
        toast.error(`Minimum amount for hyperemotes is ₹${minAmount}`);
        return;
      }
      if (!selectedGif) {
        toast.error('Please select a GIF for your hyperemote');
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

    setIsPhoneDialogOpen(true);
  };

  const handlePaymentWithPhone = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return;
    }

    setPhoneError('');
    setIsProcessingPayment(true);

    try {
      let voiceMessageUrl = null;

      // Upload voice message BEFORE creating payment order
      if (donationType === 'voice' && voiceRecorder.audioBlob) {
        console.log('Uploading voice message before payment...');
        const reader = new FileReader();
        const voiceDataBase64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });

        // Upload voice message using edge function
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

      const response = await fetch(
        'https://vsevsjvtrshgeiudrnth.supabase.co/functions/v1/create-payment-order-damask-plays',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            amount: parseFloat(formData.amount),
            message: donationType === 'text' ? formData.message : null,
            voiceMessageUrl: voiceMessageUrl,
            isHyperemote: donationType === 'hyperemote',
            phone: phoneNumber,
            selectedGifId: donationType === 'hyperemote' ? selectedGif : null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment initialization failed');
      }

      const { payment_session_id, order_id } = await response.json();

      const checkoutOptions = {
        paymentSessionId: payment_session_id,
        redirectTarget: '_self',
      };

      if (cashfree) {
        cashfree.checkout(checkoutOptions);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
      setIsPhoneDialogOpen(false);
    }
  };

  const getMinAmount = () => {
    switch (donationType) {
      case 'voice':
        return 150;
      case 'hyperemote':
        return streamerSettings?.hyperemotes_min_amount || 50;
      case 'text':
      default:
        return 40;
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
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 relative"
      style={{ backgroundImage: `url(${damaskBanner})` }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      
      <Card 
        className="w-full max-w-md mx-auto bg-card/95 backdrop-blur-sm border-emerald-500/20 shadow-2xl relative overflow-hidden"
        style={{ 
          backgroundImage: `url(${damaskProfile})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/50"></div>
        
        {/* Card glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-emerald-600/20 to-emerald-400/20 opacity-50 blur-xl"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-emerald-600/10 to-emerald-400/10 opacity-50 blur-xl"></div>
        
        <CardHeader className="text-center space-y-4 relative z-10">
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-500 shadow-xl">
              <img src={damaskLogo} alt="Damask plays" className="w-full h-full object-cover" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
              Damask Plays
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-2">
              Support Damask Plays with your donation
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="donationType" className="text-base font-semibold text-emerald-500">
                Choose Donation Type
              </Label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setDonationType('text')}
                  className={`flex flex-col items-center justify-between rounded-md border-2 p-4 transition-all ${
                    donationType === 'text'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-emerald-500/30 hover:border-emerald-500/50 bg-card'
                  }`}
                >
                  <span className="text-2xl mb-2">💬</span>
                  <span className="text-sm font-medium">Text Message</span>
                  <span className="text-xs text-muted-foreground mt-1">₹40 min</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDonationType('voice')}
                  className={`flex flex-col items-center justify-between rounded-md border-2 p-4 transition-all ${
                    donationType === 'voice'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-emerald-500/30 hover:border-emerald-500/50 bg-card'
                  }`}
                >
                  <span className="text-2xl mb-2">🎤</span>
                  <span className="text-sm font-medium">Voice Message</span>
                  <span className="text-xs text-muted-foreground mt-1">₹150 min</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDonationType('hyperemote')}
                  className={`flex flex-col items-center justify-between rounded-md border-2 p-4 transition-all ${
                    donationType === 'hyperemote'
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-emerald-500/30 hover:border-emerald-500/50 bg-card'
                  }`}
                >
                  <span className="text-2xl mb-2">🎉</span>
                  <span className="text-sm font-medium">Hyperemotes</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    ₹{streamerSettings?.hyperemotes_min_amount || 50} min
                  </span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-emerald-500">Your Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your name"
                required
                className="border-emerald-500/30 focus:border-emerald-500 bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-emerald-500">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="Enter amount"
                min={getMinAmount()}
                required
                className="border-emerald-500/30 focus:border-emerald-500 bg-background"
              />
            </div>

            {donationType === 'text' && (
              <div className="space-y-2">
                <Label htmlFor="message" className="text-emerald-500">Your Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Enter your message..."
                  maxLength={getCharacterLimit()}
                  className="border-emerald-500/30 focus:border-emerald-500 min-h-[100px] bg-background"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {currentMessageLength}/{currentCharLimit} characters
                </p>
              </div>
            )}

            {donationType === 'hyperemote' && (
              <div className="space-y-3">
                <Label className="text-emerald-500">Choose Your Hyperemote GIF</Label>
                <div className="grid grid-cols-2 gap-3">
                  {availableGifs.map((gif) => (
                    <div
                      key={gif.name}
                      onClick={() => setSelectedGif(gif.name)}
                      className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all hover:scale-105 ${
                        selectedGif === gif.name
                          ? 'border-emerald-500 ring-2 ring-emerald-500/50'
                          : 'border-emerald-500/30 hover:border-emerald-500/50'
                      }`}
                    >
                      <img
                        src={gif.url}
                        alt={gif.name.replace('.gif', '')}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-2 bg-card/50 backdrop-blur">
                        <p className="text-xs text-center text-foreground font-medium truncate">
                          {gif.name.replace('.gif', '').replace(/-/g, ' ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {availableGifs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Loading GIFs...
                  </p>
                )}
              </div>
            )}

            {donationType === 'voice' && (
              <div className="space-y-2">
                <Label className="text-emerald-500">Record Voice Message</Label>
                <EnhancedVoiceRecorder 
                  controller={voiceRecorder}
                  currentAmount={currentAmount}
                  requiredAmount={150}
                  brandColor="#10b981"
                  onRecordingComplete={() => {}}
                />
              </div>
            )}

            {donationType === 'hyperemote' && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                <p className="text-sm text-muted-foreground">
                  Hyperemotes will trigger special visual effects during the stream!
                  Minimum amount: ₹{streamerSettings?.hyperemotes_min_amount || 50}
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-emerald-500 hover:bg-emerald-600"
              disabled={sdkLoading || isProcessingPayment}
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
        onContinue={handlePaymentWithPhone}
        isSubmitting={isProcessingPayment}
        buttonColor="#10b981"
      />
    </div>
  );
};

export default DamaskPlays;
