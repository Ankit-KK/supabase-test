import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import EnhancedVoiceRecorder from '@/components/EnhancedVoiceRecorder';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { Crown } from 'lucide-react';

const notyourkweenBanner = '/lovable-uploads/notyourkween-banner.jpg';
const notyourkweenLogo = '/lovable-uploads/notyourkween-logo.jpg';

const NotYourKween = () => {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    message: '',
  });
  const [donationType, setDonationType] = useState<'text' | 'voice' | 'hyperemote'>('text');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
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
    const loadRazorpay = () => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        setRazorpayLoaded(true);
        toast.success('Payment system ready');
      };
      script.onerror = () => {
        toast.error('Failed to load payment system');
      };
      document.body.appendChild(script);
    };

    const fetchStreamerSettings = async () => {
      const { data, error } = await supabase.rpc('get_streamer_public_settings', {
        slug: 'notyourkween'
      });
      
      if (!error && data && data.length > 0) {
        setStreamerSettings(data[0]);
      }
    };

    loadRazorpay();
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

    setIsProcessingPayment(true);

    try {
      let voiceMessageUrl = null;

      if (donationType === 'voice' && voiceRecorder.audioBlob) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64.split(',')[1]);
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(voiceRecorder.audioBlob);
        const base64Audio = await base64Promise;

        const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-voice-message-direct', {
          body: { voiceData: base64Audio, streamerSlug: 'notyourkween' }
        });

        if (uploadError || !uploadData?.voice_message_url) {
          throw new Error('Failed to upload voice message');
        }

        voiceMessageUrl = uploadData.voice_message_url;
      }

      const { data, error } = await supabase.functions.invoke('create-razorpay-order-notyourkween', {
        body: {
          name: formData.name,
          amount,
          message: donationType === 'text' ? formData.message : null,
          voiceMessageUrl,
          isHyperemote: donationType === 'hyperemote',
        }
      });

      if (error) throw error;

      const options = {
        key: data.razorpay_key_id,
        amount: data.amount,
        currency: 'INR',
        name: 'HyperChat - not your Kween',
        description: donationType === 'hyperemote' ? 'Crown Effect' : 
                     donationType === 'voice' ? 'Voice Interactions' : 'Text Interactions',
        order_id: data.razorpay_order_id,
        prefill: {
          name: formData.name
        },
        theme: {
          color: '#ec4899'
        },
        handler: function (response: any) {
          navigate(`/status?order_id=${data.internalOrderId}&status=success`);
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
            navigate(`/status?order_id=${data.internalOrderId}&status=pending`);
          }
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  return (
    <div 
      className="min-h-screen relative bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${notyourkweenBanner})` }}
    >
      <div className="absolute inset-0 bg-black/40" />
      
      <div className="relative z-10 container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <Card 
          className="w-full max-w-[21rem] border-2 border-pink-500/50 shadow-2xl backdrop-blur-md overflow-hidden relative bg-cover bg-center"
          style={{ backgroundImage: `url(${notyourkweenLogo})` }}
        >
          <div className="absolute inset-0 bg-background/50" />
          <div className="relative z-10">
          <CardHeader className="text-center pb-4 space-y-3">
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">not your Kween</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Premium Engagement Platform</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2 text-center mb-4">
              <Label className="text-pink-200 text-xs font-medium block">Select Interaction Type</Label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setDonationType('text')}
                  className={`p-2 rounded-lg border transition-all ${
                    donationType === 'text'
                      ? 'bg-pink-600/80 border-pink-500/60 text-white shadow-md'
                      : 'bg-pink-900/40 border-pink-700/30 text-pink-300 hover:bg-pink-800/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-0.5">💬</div>
                    <div className="font-medium text-[10px]">Text Interactions</div>
                    <div className="text-[9px]">Min: ₹40</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDonationType('voice');
                    voiceRecorder.clearRecording();
                  }}
                  className={`p-2 rounded-lg border transition-all ${
                    donationType === 'voice'
                      ? 'bg-pink-600/80 border-pink-500/60 text-white shadow-md'
                      : 'bg-pink-900/40 border-pink-700/30 text-pink-300 hover:bg-pink-800/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-0.5">🎤</div>
                    <div className="font-medium text-[10px]">Voice Interactions</div>
                    <div className="text-[9px]">Min: ₹150</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDonationType('hyperemote')}
                  className={`p-2 rounded-lg border transition-all ${
                    donationType === 'hyperemote'
                      ? 'bg-pink-600/80 border-pink-500/60 text-white shadow-md'
                      : 'bg-pink-900/40 border-pink-700/30 text-pink-300 hover:bg-pink-800/50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-0.5">👑</div>
                    <div className="font-medium text-[10px]">Royal Crown</div>
                    <div className="text-[9px]">Min: ₹50</div>
                  </div>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-pink-200 text-xs">Your Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  className="bg-pink-950/40 border-pink-700/40 text-pink-100 placeholder:text-pink-500/50 focus:border-pink-500 text-sm h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-pink-200 text-xs">Amount (₹)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder={`Min: ₹${donationType === 'voice' ? '150' : donationType === 'hyperemote' ? '50' : '40'}`}
                  min={donationType === 'voice' ? '150' : donationType === 'hyperemote' ? '50' : '40'}
                  className="bg-pink-950/40 border-pink-700/40 text-pink-100 placeholder:text-pink-500/50 focus:border-pink-500 text-sm h-9"
                  required
                />
                <p className="text-xs text-pink-400">TTS above ₹70</p>
              </div>

              {donationType === 'text' && (
                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-pink-200 text-xs">Your Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Enter your message..."
                    className="bg-pink-950/40 border-pink-700/40 text-pink-100 placeholder:text-pink-500/50 focus:border-pink-500 min-h-[80px] text-sm resize-none"
                    maxLength={250}
                    required
                  />
                  <p className="text-[10px] text-pink-400">{formData.message.length}/250 characters</p>
                </div>
              )}

              {donationType === 'voice' && (
                <div className="space-y-1.5">
                  <Label className="text-pink-200 text-xs">Voice Message (Max {getVoiceDuration(currentAmount)}s)</Label>
                  <EnhancedVoiceRecorder
                    controller={voiceRecorder}
                    maxDurationSeconds={getVoiceDuration(currentAmount)}
                    onRecordingComplete={(hasRecording) => {
                      if (!hasRecording) {
                        toast.error('Please record a voice message');
                      }
                    }}
                    requiredAmount={150}
                    currentAmount={currentAmount}
                    brandColor="#ec4899"
                  />
                </div>
              )}

              {donationType === 'hyperemote' && (
                <div className="p-3 bg-gradient-to-br from-pink-900/50 to-rose-800/40 border border-pink-500/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <Crown className="w-10 h-10 text-pink-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-pink-100 font-semibold text-sm">Royal Crown Effect</h3>
                      <p className="text-pink-300 text-xs mt-0.5">Trigger a majestic crown celebration on stream!</p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-semibold h-10 text-sm shadow-lg transition-all"
                disabled={isProcessingPayment || !razorpayLoaded}
              >
                {isProcessingPayment ? 'Processing...' : `Pay ₹${formData.amount || '0'}`}
              </Button>
            </form>
          </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NotYourKween;
