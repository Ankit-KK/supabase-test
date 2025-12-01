import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
// Razorpay - loaded via script tag
import EnhancedVoiceRecorder from '@/components/EnhancedVoiceRecorder';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
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
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

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

    return () => {
      document.body.removeChild(script);
    };
  }, []);

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

    await processPayment();
  };

  const processPayment = async () => {
    setIsProcessingPayment(true);

    try {
      let voiceMessageUrl = null;

      // Upload voice message BEFORE creating payment order
      if (donationType === 'voice' && voiceRecorder.audioBlob) {
        console.log('Uploading voice message before payment...', { 
          blobSize: voiceRecorder.audioBlob.size,
          blobType: voiceRecorder.audioBlob.type 
        });

        if (!voiceRecorder.audioBlob || voiceRecorder.audioBlob.size === 0) {
          throw new Error('No voice recording found. Please record your message again.');
        }

        // Convert blob to base64
        const voiceDataBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          
          reader.onload = () => {
            const result = reader.result as string;
            if (!result || !result.includes(',')) {
              reject(new Error('Failed to read voice data'));
              return;
            }
            const base64 = result.split(',')[1];
            console.log('Voice data converted to base64, length:', base64.length);
            resolve(base64);
          };
          
          reader.onerror = () => {
            reject(new Error('Failed to read voice recording'));
          };
          
          reader.readAsDataURL(voiceRecorder.audioBlob!);
        });

        if (!voiceDataBase64 || voiceDataBase64.length === 0) {
          throw new Error('Voice recording is empty. Please try recording again.');
        }

        console.log('Invoking upload-voice-message-direct...');

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
          throw new Error('Failed to upload voice message: ' + uploadError.message);
        }

        if (!uploadResult?.voice_message_url) {
          throw new Error('Voice upload succeeded but no URL was returned');
        }

        voiceMessageUrl = uploadResult.voice_message_url;
        console.log('Voice message uploaded successfully:', voiceMessageUrl);
      }

      const response = await supabase.functions.invoke('create-razorpay-order-damask-plays', {
        body: {
          name: formData.name,
          amount: parseFloat(formData.amount),
          message: donationType === 'text' ? formData.message : null,
          voiceMessageUrl: voiceMessageUrl,
          isHyperemote: donationType === 'hyperemote',
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Payment initialization failed');
      }

      const data = response.data;

      // Initialize Razorpay checkout
      const options = {
        key: data.razorpay_key_id,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpay_order_id,
        name: 'Damask Plays',
        description: 'Support Damask Plays',
        handler: function (response: any) {
          console.log('Payment successful:', response);
          navigate(`/status?order_id=${data.orderId}&status=success`);
        },
        modal: {
          ondismiss: function() {
            console.log('Payment cancelled');
            navigate(`/status?order_id=${data.orderId}&status=pending`);
          }
        },
        theme: {
          color: '#10b981'
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
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
        
        <CardHeader className="text-center space-y-3 relative z-10">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-500 shadow-xl">
              <img src={damaskLogo} alt="Damask plays" className="w-full h-full object-cover" />
            </div>
          </div>
          <div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
              Damask Plays
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              Support Damask Plays with your donation
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="donationType" className="text-sm font-semibold text-emerald-500">
                Choose Donation Type
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setDonationType('text')}
                  className={`h-20 flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 transition-all ${
                    donationType === 'text'
                      ? 'border-emerald-400 bg-gradient-to-br from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-500/50 scale-105'
                      : 'border-emerald-500/40 hover:border-emerald-500/60 bg-black/50 hover:bg-black/70 text-emerald-200 hover:scale-105'
                  }`}
                >
                  <span className="text-3xl">💬</span>
                  <span className="text-xs font-bold tracking-wide">Text</span>
                  <span className="text-[10px] opacity-80 font-medium">Min ₹40</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDonationType('voice')}
                  className={`h-20 flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 transition-all ${
                    donationType === 'voice'
                      ? 'border-emerald-400 bg-gradient-to-br from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-500/50 scale-105'
                      : 'border-emerald-500/40 hover:border-emerald-500/60 bg-black/50 hover:bg-black/70 text-emerald-200 hover:scale-105'
                  }`}
                >
                  <span className="text-3xl">🎤</span>
                  <span className="text-xs font-bold tracking-wide">Voice</span>
                  <span className="text-[10px] opacity-80 font-medium">Min ₹150</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDonationType('hyperemote')}
                  className={`h-20 flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 transition-all ${
                    donationType === 'hyperemote'
                      ? 'border-emerald-400 bg-gradient-to-br from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-500/50 scale-105'
                      : 'border-emerald-500/40 hover:border-emerald-500/60 bg-black/50 hover:bg-black/70 text-emerald-200 hover:scale-105'
                  }`}
                >
                  <span className="text-3xl">🎁</span>
                  <span className="text-xs font-bold tracking-wide">Effects</span>
                  <span className="text-[10px] opacity-80 font-medium">
                    Min ₹{streamerSettings?.hyperemotes_min_amount || 50}
                  </span>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="name" className="text-sm text-emerald-500">Your Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your name"
                required
                className="border-emerald-500/30 focus:border-emerald-500 bg-background"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="amount" className="text-sm text-emerald-500">Amount (₹)</Label>
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
              <p className="text-xs text-muted-foreground">TTS above ₹70</p>
            </div>

            {donationType === 'text' && (
              <div className="space-y-1">
                <Label htmlFor="message" className="text-sm text-emerald-500">Your Message</Label>
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
              <div className="space-y-2">
                <Label className="text-sm text-emerald-500">Hyperemote Effect Preview</Label>
                <div className="p-4 rounded-lg border-2 border-emerald-500 bg-emerald-500/10">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">🌧️</span>
                    <div className="flex-1">
                      <p className="font-bold text-emerald-100 text-base">
                        GIF Rain Effect
                      </p>
                      <p className="text-sm text-emerald-300/80 mt-2">
                        All animated GIFs will rain down from the top of the screen with spiraling and floating animations! 
                        Your donation triggers an epic visual spectacle for the stream.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {donationType === 'voice' && (
              <div className="space-y-1">
                <Label className="text-sm text-emerald-500">Record Voice Message</Label>
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
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2">
                <p className="text-xs text-muted-foreground">
                  Hyperemotes will trigger special visual effects during the stream!
                  Minimum amount: ₹{streamerSettings?.hyperemotes_min_amount || 50}
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-emerald-500 hover:bg-emerald-600"
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? 'Processing...' : 'Continue to Payment'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DamaskPlays;
