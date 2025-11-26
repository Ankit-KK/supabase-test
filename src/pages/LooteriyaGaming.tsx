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
// Razorpay - loaded via script tag
import EnhancedVoiceRecorder from '@/components/EnhancedVoiceRecorder';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
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
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    const fetchStreamerSettings = async () => {
      const { data, error } = await supabase.rpc('get_streamer_public_settings', {
        slug: 'looteriya_gaming'
      });
      
      if (!error && data && data.length > 0) {
        setStreamerSettings(data[0]);
      }
    };

    fetchStreamerSettings();

    return () => {
      document.body.removeChild(script);
    };
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

    // Validate minimum amounts based on donation type
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

    if (donationType === 'voice' && !voiceRecorder.audioBlob) {
      toast.error('Please record a voice message');
      return;
    }

    await processPayment();
  };

  const processPayment = async () => {
    setIsProcessingPayment(true);

    try {
      // Upload voice message BEFORE creating payment order
      let voiceMessageUrl: string | null = null;
      if (donationType === 'voice' && voiceRecorder.audioBlob) {
        console.log('Uploading voice message before payment...', { 
          blobSize: voiceRecorder.audioBlob.size,
          blobType: voiceRecorder.audioBlob.type 
        });

        // Validate blob has data
        if (!voiceRecorder.audioBlob || voiceRecorder.audioBlob.size === 0) {
          throw new Error('No voice recording found. Please record your message again.');
        }

        // Convert blob to base64 with proper error handling
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

        // Upload voice message directly
        const { data: uploadResult, error: uploadError } = await supabase.functions.invoke(
          'upload-voice-message-direct',
          {
            body: { 
              voiceData: voiceDataBase64, 
              streamerSlug: 'looteriya_gaming'
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

      const { data, error } = await supabase.functions.invoke('create-razorpay-order-looteriya-gaming', {
        body: {
          name: formData.name,
          amount: parseFloat(formData.amount),
          message: donationType === 'text' ? formData.message : null,
          voiceMessageUrl: voiceMessageUrl,
          isHyperemote: donationType === 'hyperemote',
        },
      });

      if (error) throw error;

      // Initialize Razorpay checkout
      const options = {
        key: data.razorpay_key_id,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpay_order_id,
        name: 'Looteriya Gaming',
        description: 'Support Looteriya Gaming',
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
          color: '#f59e0b'
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleDonationTypeChange = (value: string) => {
    setDonationType(value as 'text' | 'voice' | 'hyperemote');
    if (value === 'hyperemote') {
      setFormData(prev => ({ ...prev, amount: '50', message: '' }));
    } else if (value === 'voice') {
      setFormData(prev => ({ ...prev, amount: '150', message: '' }));
    } else {
      setFormData(prev => ({ ...prev, amount: '40', message: '' }));
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
        <div className="absolute inset-0 bg-black/50"></div>
        
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
            <div className="space-y-2">
              <label className="text-xs font-medium text-amber-500">
                Choose your donation type
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDonationTypeChange('text')}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    donationType === 'text'
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-amber-500/30 hover:border-amber-500/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm mb-0.5">💬</div>
                    <div className="font-medium text-[10px]">Text Message</div>
                    <div className="text-[9px] text-muted-foreground">Min: ₹40</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDonationTypeChange('voice')}
                  className={`p-2 rounded-lg border-2 transition-all ${
                    donationType === 'voice'
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-amber-500/30 hover:border-amber-500/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm mb-0.5">🎤</div>
                    <div className="font-medium text-[10px]">Voice Message</div>
                    <div className="text-[9px] text-muted-foreground">Min: ₹150</div>
                  </div>
                </button>
                {streamerSettings?.hyperemotes_enabled && (
                  <button
                    type="button"
                    onClick={() => handleDonationTypeChange('hyperemote')}
                    className={`relative p-2 rounded-lg border-2 transition-all overflow-hidden ${
                      donationType === 'hyperemote'
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-amber-500/30 hover:border-amber-500/50'
                    }`}
                  >
                    <div 
                      className="absolute inset-0 opacity-10"
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #fb923c 100%)'
                      }}
                    />
                    <div className="relative text-center">
                      <div className="text-base mb-0.5">✨🎉</div>
                      <div className="font-bold text-[10px] mb-0.5">Hyperemote Rain</div>
                      <div className="text-[9px] text-muted-foreground mb-1">Animated GIFs!</div>
                      <div className="text-[9px] font-medium text-amber-500">Min: ₹50</div>
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

export default LooteriyaGaming;
